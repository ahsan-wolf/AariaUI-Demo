// Persistence boundary of the membership engine. Implement IUserStore / IRoleStore for your database (SQL, Mongo, REST);
// run userStoreContractCases / roleStoreContractCases against it to prove it behaves like the in-memory reference.
export class StoreConflictError extends Error {
    field;
    constructor(field, message) {
        super(message);
        this.field = field;
        this.name = "StoreConflictError";
    }
}
const lower = (s) => s.toLowerCase();
const clone = (r) => ({ ...r, customData: r.customData ? { ...r.customData } : undefined });
/** LIKE pattern (`%`, `_`) to a case-insensitive RegExp. */
export function likeToRegExp(pattern) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".");
    return new RegExp(`^${escaped}$`, "is");
}
export class InMemoryUserStore {
    requireUniqueEmail;
    byName = new Map();
    /** @param requireUniqueEmail Reject a second user with the same e-mail (default true, like requiresUniqueEmail). */
    constructor(requireUniqueEmail = true) {
        this.requireUniqueEmail = requireUniqueEmail;
    }
    async findByName(userName) {
        const r = this.byName.get(lower(userName));
        return r ? clone(r) : null;
    }
    async findByEmail(email) {
        const e = lower(email);
        for (const r of this.byName.values())
            if (r.email && lower(r.email) === e)
                return clone(r);
        return null;
    }
    async findByKey(key) {
        for (const r of this.byName.values())
            if (r.key === key)
                return clone(r);
        return null;
    }
    async create(record) {
        if (this.byName.has(lower(record.userName)))
            throw new StoreConflictError("userName", `User '${record.userName}' already exists.`);
        if (this.requireUniqueEmail && record.email && (await this.findByEmail(record.email)))
            throw new StoreConflictError("email", "E-mail already in use.");
        this.byName.set(lower(record.userName), clone(record));
    }
    async update(record) {
        for (const [k, r] of this.byName) {
            if (r.key === record.key) {
                if (lower(record.userName) !== k) {
                    if (this.byName.has(lower(record.userName)))
                        throw new StoreConflictError("userName", "User name already in use.");
                    this.byName.delete(k);
                }
                if (this.requireUniqueEmail && record.email) {
                    const other = await this.findByEmail(record.email);
                    if (other && other.key !== record.key)
                        throw new StoreConflictError("email", "E-mail already in use.");
                }
                this.byName.set(lower(record.userName), clone(record));
                return;
            }
        }
        throw new Error(`User '${record.userName}' does not exist.`);
    }
    async delete(userName) {
        return this.byName.delete(lower(userName));
    }
    async list(skip, take) {
        const all = [...this.byName.values()].sort((a, b) => lower(a.userName).localeCompare(lower(b.userName)));
        return { items: all.slice(skip, skip + take).map(clone), total: all.length };
    }
    async search(field, pattern, skip, take) {
        const re = likeToRegExp(pattern);
        const all = [...this.byName.values()]
            .filter((r) => { const v = field === "userName" ? r.userName : r.email; return v !== undefined && re.test(v); })
            .sort((a, b) => lower(a.userName).localeCompare(lower(b.userName)));
        return { items: all.slice(skip, skip + take).map(clone), total: all.length };
    }
    async countActiveSince(sinceMs) {
        let n = 0;
        for (const r of this.byName.values())
            if ((r.lastActivityDate ?? 0) >= sinceMs)
                n++;
        return n;
    }
}
export class InMemoryRoleStore {
    // lower-case role name -> { display name, lower-case user names }
    roles = new Map();
    async createRole(roleName) {
        const key = lower(roleName);
        if (this.roles.has(key))
            throw new StoreConflictError("role", `Role '${roleName}' already exists.`);
        this.roles.set(key, { name: roleName, users: new Set() });
    }
    async deleteRole(roleName, throwOnPopulated) {
        const r = this.roles.get(lower(roleName));
        if (!r)
            return false;
        if (throwOnPopulated && r.users.size > 0)
            throw new Error(`Role '${roleName}' is not empty.`);
        return this.roles.delete(lower(roleName));
    }
    async roleExists(roleName) {
        return this.roles.has(lower(roleName));
    }
    async getAllRoles() {
        return [...this.roles.values()].map((r) => r.name);
    }
    resolve(roleNames) {
        return roleNames.map((n) => {
            const r = this.roles.get(lower(n));
            if (!r)
                throw new Error(`Role '${n}' does not exist.`);
            return r;
        });
    }
    async addUsersToRoles(userNames, roleNames) {
        const targets = this.resolve(roleNames);
        for (const r of targets)
            for (const u of userNames)
                if (r.users.has(lower(u)))
                    throw new Error(`User '${u}' is already in role '${r.name}'.`);
        for (const r of targets)
            for (const u of userNames)
                r.users.add(lower(u));
    }
    async removeUsersFromRoles(userNames, roleNames) {
        const targets = this.resolve(roleNames);
        for (const r of targets)
            for (const u of userNames)
                if (!r.users.has(lower(u)))
                    throw new Error(`User '${u}' is not in role '${r.name}'.`);
        for (const r of targets)
            for (const u of userNames)
                r.users.delete(lower(u));
    }
    /** Adds a membership immediately (creating the role if needed). For seeding, where awaiting is not possible. */
    addSync(userName, roleName) {
        let r = this.roles.get(lower(roleName));
        if (!r) {
            r = { name: roleName, users: new Set() };
            this.roles.set(lower(roleName), r);
        }
        r.users.add(lower(userName));
    }
    async getRolesForUser(userName) {
        return this.getRolesForUserSync(userName);
    }
    /** Synchronous read for providers that must answer `isInRole` without awaiting (in-memory only). */
    getRolesForUserSync(userName) {
        const u = lower(userName);
        return [...this.roles.values()].filter((r) => r.users.has(u)).map((r) => r.name);
    }
    async getUsersInRole(roleName) {
        const r = this.roles.get(lower(roleName));
        if (!r)
            throw new Error(`Role '${roleName}' does not exist.`);
        return [...r.users];
    }
    async removeUserFromAllRoles(userName) {
        const u = lower(userName);
        for (const r of this.roles.values())
            r.users.delete(u);
    }
}
const sample = (userName, over = {}) => ({
    key: `key-${userName.toLowerCase()}`, userName, email: `${userName.toLowerCase()}@example.com`, passwordHash: "$test$hash",
    isApproved: true, isLockedOut: false, failedPasswordAttempts: 0, failedAnswerAttempts: 0,
    creationDate: 1000, lastPasswordChangedDate: 1000, ...over,
});
/** Behaviour every IUserStore must have. Drive it from any test runner: `for (const c of userStoreContractCases(make)) test(c.name, () => c.run(assert))`. */
export function userStoreContractCases(make) {
    return [
        { name: "creates and finds by name (case-insensitive), key and e-mail", async run(a) {
                const s = await make();
                await s.create(sample("Alice"));
                a.equal((await s.findByName("aLiCe"))?.userName, "Alice");
                a.equal((await s.findByKey("key-alice"))?.userName, "Alice");
                a.equal((await s.findByEmail("ALICE@example.com"))?.userName, "Alice");
                a.equal(await s.findByName("nobody"), null);
            } },
        { name: "rejects a duplicate user name and a duplicate e-mail", async run(a) {
                const s = await make();
                await s.create(sample("Alice"));
                await a.rejects(s.create(sample("ALICE", { key: "k2", email: "other@example.com" })), /already exists/);
                await a.rejects(s.create(sample("Bob", { email: "alice@example.com" })), /E-mail/);
            } },
        { name: "returned records are copies (mutating them does not change the store)", async run(a) {
                const s = await make();
                await s.create(sample("Alice"));
                const r = (await s.findByName("alice"));
                r.isApproved = false;
                a.equal((await s.findByName("alice"))?.isApproved, true);
            } },
        { name: "update replaces by key and can rename; unknown key throws", async run(a) {
                const s = await make();
                await s.create(sample("Alice"));
                const r = (await s.findByName("alice"));
                r.comment = "hello";
                r.userName = "AliceRenamed";
                await s.update(r);
                a.equal((await s.findByName("alicerenamed"))?.comment, "hello");
                a.equal(await s.findByName("alice"), null);
                await a.rejects(s.update(sample("Ghost")), /does not exist/);
            } },
        { name: "delete removes the user", async run(a) {
                const s = await make();
                await s.create(sample("Alice"));
                a.equal(await s.delete("ALICE"), true);
                a.equal(await s.delete("alice"), false);
                a.equal(await s.findByName("alice"), null);
            } },
        { name: "list pages in user-name order with a total", async run(a) {
                const s = await make();
                for (const n of ["Carol", "alice", "Bob", "dave"])
                    await s.create(sample(n));
                const p1 = await s.list(0, 2);
                const p2 = await s.list(2, 2);
                a.deepEqual(p1.items.map((u) => u.userName), ["alice", "Bob"]);
                a.deepEqual(p2.items.map((u) => u.userName), ["Carol", "dave"]);
                a.equal(p1.total, 4);
            } },
        { name: "search uses LIKE wildcards, case-insensitively, on name and e-mail", async run(a) {
                const s = await make();
                for (const n of ["Alice", "Alina", "Bob"])
                    await s.create(sample(n));
                a.deepEqual((await s.search("userName", "ali%", 0, 10)).items.map((u) => u.userName), ["Alice", "Alina"]);
                a.deepEqual((await s.search("userName", "Al_ce", 0, 10)).items.map((u) => u.userName), ["Alice"]);
                a.equal((await s.search("email", "%@example.com", 0, 10)).total, 3);
                a.equal((await s.search("userName", "a.i%", 0, 10)).total, 0, "regex characters are literal");
            } },
        { name: "countActiveSince counts recent activity", async run(a) {
                const s = await make();
                await s.create(sample("Alice", { lastActivityDate: 5000 }));
                await s.create(sample("Bob", { lastActivityDate: 1000 }));
                await s.create(sample("Carol"));
                a.equal(await s.countActiveSince(3000), 1);
                a.equal(await s.countActiveSince(0), 3);
            } },
    ];
}
export function roleStoreContractCases(make) {
    return [
        { name: "creates roles case-insensitively unique and lists them", async run(a) {
                const s = await make();
                await s.createRole("Admins");
                await a.rejects(s.createRole("admins"), /already exists/);
                a.equal(await s.roleExists("ADMINS"), true);
                a.deepEqual(await s.getAllRoles(), ["Admins"]);
            } },
        { name: "adds and removes users; duplicates and unknown roles throw and change nothing", async run(a) {
                const s = await make();
                await s.createRole("Admins");
                await s.createRole("Users");
                await s.addUsersToRoles(["Alice", "Bob"], ["Users"]);
                await a.rejects(s.addUsersToRoles(["Alice", "Carol"], ["Admins", "Users"]), /already in role/);
                a.deepEqual(await s.getUsersInRole("Admins"), [], "failed add left Admins untouched");
                await a.rejects(s.addUsersToRoles(["Alice"], ["Nope"]), /does not exist/);
                a.deepEqual((await s.getRolesForUser("alice")).sort(), ["Users"]);
                await s.removeUsersFromRoles(["Bob"], ["Users"]);
                await a.rejects(s.removeUsersFromRoles(["Bob"], ["Users"]), /not in role/);
            } },
        { name: "deleteRole honours throwOnPopulated and returns false for unknown roles", async run(a) {
                const s = await make();
                await s.createRole("Admins");
                await s.addUsersToRoles(["Alice"], ["Admins"]);
                await a.rejects(s.deleteRole("Admins", true), /not empty/);
                a.equal(await s.deleteRole("admins", false), true);
                a.equal(await s.deleteRole("admins", false), false);
                a.deepEqual(await s.getRolesForUser("Alice"), []);
            } },
        { name: "removeUserFromAllRoles clears every membership", async run(a) {
                const s = await make();
                await s.createRole("A");
                await s.createRole("B");
                await s.addUsersToRoles(["Alice"], ["A", "B"]);
                await s.removeUserFromAllRoles("ALICE");
                a.deepEqual(await s.getRolesForUser("alice"), []);
            } },
    ];
}
//# sourceMappingURL=user-store.js.map
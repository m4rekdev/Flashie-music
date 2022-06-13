const { Database } = require("@devsnowflake/quick.db");
const db = new Database("./data.db"); 

class Lock {
    async get() {
        return await db.get('lock');
    }

    async set(boolean) {
        await db.set('lock', boolean)
        return boolean;
    }
}

module.exports = new Lock();
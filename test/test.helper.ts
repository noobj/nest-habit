import { Connection } from 'mongoose';

export async function clearCollections(db: Connection) {
    const collections = db.collections;

    await Promise.all(
        Object.values(collections).map(async (collection) => {
            await collection.deleteMany({});
        })
    );
}

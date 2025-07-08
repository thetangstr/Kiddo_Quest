const userId = '3eh13xM3e7c9tODdZrAFVMppR2F2';

console.log(`Firestore queries for user: ${userId}`);
console.log('\n--- Child Profiles ---');
console.log(`db.collection('childProfiles').where('parentId', '==', '${userId}').get()`);

console.log('\n--- Quests ---');
console.log(`db.collection('quests').where('parentId', '==', '${userId}').get()`);

console.log('\n--- Rewards ---');
console.log(`db.collection('rewards').where('parentId', '==', '${userId}').get()`);
const { Firestore } = require('@google-cloud/firestore');
 
async function storeData(id, data) {
  const db = new Firestore({databaseId: "(default)" });
 
  const predictCollection = db.collection('histories');
  return predictCollection.doc(id).set(data);
}
async function getData() {
  const db = new Firestore({databaseId: "(default)" });
 
  const history = await db.collection('predictions').get();
  return history;
}
 
module.exports = { storeData, getData };
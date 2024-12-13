const { Firestore } = require('@google-cloud/firestore');
 
async function storeData(id, data) {
  const db = new Firestore({databaseId: "(default)" });
 
  const predictCollection = db.collection('histories');
  return predictCollection.doc(id).set(data);
}
async function getallData() {
  const db = new Firestore({databaseId: "(default)" });
 
  const history = await db.collection('histories').get();
  const result = history.docs.map(doc => {
    const data = doc.data();
    return {
        gender: data.gender,
        perDay: data.perDay,
        stability: data.stability,
        id: doc.id
    };
  });
  return result;
}
async function getDataById(documentId) {
  const db = new Firestore({ databaseId: "(default)" });

  // Reference the specific document by ID
  const docRef = db.collection('histories').doc(documentId);

  // Get the document
  const doc = await docRef.get();

  // Check if the document exists
  if (!doc.exists) {
    console.error('No document found with the given ID:', documentId);
    return null;
  }
    const data = doc.data();
    return {
        gender: data.gender,
        perDay: data.perDay,
        stability: data.stability,
        id: doc.id
    };
}
 
module.exports = { storeData, getallData, getDataById };
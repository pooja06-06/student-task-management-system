const DATABASE_NAME = "student_task_proofs";
const STORE_NAME = "proofs";

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runTransaction = async (mode, operation) => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
};

export const saveProofFile = (id, file) =>
  runTransaction("readwrite", (store) => store.put(file, id));

export const getProofFile = (id) =>
  runTransaction("readonly", (store) => store.get(id));

export const deleteProofFile = (id) =>
  runTransaction("readwrite", (store) => store.delete(id));

export const openProofFile = async (id) => {
  try {
    const file = await getProofFile(id);

    if (!file) {
      alert("This attachment could not be found.");
      return;
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = file.name || "assignment-proof";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error(error);
    alert("Unable to open the attachment.");
  }
};
import {
  ActiveQuery,
  addContextToErr,
  addHandler,
  createIndependentFileSmall,
  getSeed,
  handleMessage,
  viewIndependentFileSmall,
} from "libkmodule";
import { bufToB64, validSkylink } from "libskynet";

onmessage = handleMessage;

addHandler("createEncryptedFile", handleCreateEncryptedFile);
addHandler("viewEncryptedFile", handleViewEncryptedFile);

async function handleCreateEncryptedFile(aq: ActiveQuery) {
  // Perform the input checking.
  if (!(aq.callerInput.fileData instanceof Uint8Array)) {
    aq.reject("field `fileData` expected to be a Uint8Array");
    return;
  }
  const fileData = aq.callerInput.fileData;

  // Grab the seed for the module so that we can create a new file.
  const seed = await getSeed();

  // We're going to generate a random inode for the file.
  const randBytes = new Uint8Array(16);
  crypto.getRandomValues(randBytes);
  const randStr = bufToB64(randBytes);

  // Use the seed and the file data to create an encrypted file.
  const [file, errCIF] = await createIndependentFileSmall(
    seed,
    randStr,
    fileData
  );
  if (errCIF !== null) {
    aq.reject(
      addContextToErr(errCIF, "unable to create encrypted file")
    );
    return;
  }

  // Respond with the skylink and the view key.
  aq.respond({
    skylink: file.skylink,
    viewKey: file.viewKey,
  });
}

async function handleViewEncryptedFile(aq: ActiveQuery) {
  // Perform input checking.
  const skylink = aq.callerInput.encryptedFileSkylink;
  const viewKey = aq.callerInput.viewKey;
  if (typeof skylink !== "string") {
    aq.reject("need encryptedFileSkylink to be a base64 string");
    return;
  }
  if (validSkylink(skylink) !== true) {
    aq.reject("need encryptedFileSkylink to be a base64 skylink");
    return;
  }
  if (typeof viewKey !== "string") {
    aq.reject("need viewKey to be a string");
    return;
  }

  // Open the file data.
  const [file, errVIFS] = await viewIndependentFileSmall(
    skylink,
    viewKey
  );
  if (errVIFS !== null) {
    aq.reject(addContextToErr(errVIFS, "unable to view file"));
    return;
  }
  // Read the data.
  const [fileData, errRD] = await file.readData();
  if (errRD !== null) {
    aq.reject(addContextToErr(errRD, "unable to read file contents"));
    return;
  }

  // Respond with the file data.
  aq.respond({
    fileData,
  });
}

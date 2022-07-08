import {
  addContextToErr,
  addHandler,
  createIndependentFileSmall,
  getSeed,
  handleMessage,
} from "libkmodule";
import { bufToB64 } from "libskynet";
import type { ActiveQuery } from "libkmodule";

onmessage = handleMessage;

addHandler("createEncryptedFile", handleCreateEncryptedFile);

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

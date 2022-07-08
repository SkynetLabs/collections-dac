# Collection DAC Module

This module contains all of the core logic for Collection
DAC, which allows users to upload private collections of
files that can be shared with friends or loaded into other
applications.

## Usage

### createEncryptedFile

createEncryptedFile will take a file and encrypt it,
returning a skylink to the encrypted file along with the key
for decrypting it. Someone who has the skylink and the
viewKey will be able to view the file but not modify it.
The original uploader is able to modify the file, and
the changes will be visible to anyone with the viewKey.

###### Input:

For input, we just need the file data.

```ts
{
	module: "AQBCVx2y7pqsouf2GbLU_etXglcsXZDcWHKs5IiqV0I0DQ",
	method: "createEncryptedFile",
	data: {
		fileData: <Uint8Array>,
	},
}
```

###### Output:

```ts
{
	encryptedFileSkylink: <string>,
	viewKey: <Uint8Array>,
}
```

The output is the encrypted file plus the encryption key for
the file.

import * as React from "react";
import * as kernel from "libkernel";

// LoginOrUploadCard defines an element that will be a login
// button if the user is not logged in, and it will be an upload
// button if the user is logged in.
function LoginOrUploadCard(props) {
  // Establish our stateful variables for the button. The default
  // state assumes the kernel is not initialized, which means the
  // button should say 'loading...' and be disabled.
  const [buttonText, setButtonText] = React.useState("Loading...");
  const [buttonDisabled, setButtonDisabled] = React.useState(true);
  const [buttonFn, setButtonFn] = React.useState(() => () => {});

  // Establish stateful variables for the output text.
  const [outputHidden, setOutputHidden] = React.useState(true);
  const [outputFileKey, setOutputFileKey] = React.useState("");

  // Establish the function to update our stateful variables.
  React.useEffect(() => {
    // Establish the function that will process the sequential
    // changes to the login flow.
    async function processLoginFlow() {
      // By default, everything is set as though the kernel has
      // not initialized. We first wait for the kernel to
      // initialize and then set all of the state to the user
      // not being logged in, which means the button text will
      // prompt the user to login, the button will no longer
      await kernel.init();
      setButtonText("Login to Skynet");
      setButtonDisabled(false);
      setButtonFn(() => () => {
        kernel.openAuthWindow();
      });

      // Wait for the user to be logged in. In many cases, this
      // will happen immediately.
      await kernel.loginComplete();
      setButtonText("Loading Skynet...");
      setButtonDisabled(true);
      setButtonFn(() => () => {});

      // Wait for the user kernel to load, check for any errors.
      const err = await kernel.kernelLoaded();
      if (err !== null) {
        alert(err);
        console.error(err);
        setButtonText("Unable to Load Skynet: " + err);
        setButtonDisabled(true);
        return;
      }
      setButtonText("Upload to Skynet");
      setButtonDisabled(false);
      setButtonFn(() => () => {
        document.getElementById("filePicker").click();
      });

      // Check for logoutComplete. If logout happens, we reload
      // the page so we can reset the auth flow.
      await kernel.logoutComplete();
      window.location.reload();
    }
    processLoginFlow();
  }, [props]);

  // uploadFile will process the file that is selected by the user,
  // processing it with a FileReader and then sending the result to
  // collectionsDAC to upload the file.
  const uploadFile = async () => {
    const files = document.getElementById("filePicker").files;
    if (files.length !== 1) {
      // User did not select a file.
      return;
    }

    // Update our button.
    setButtonDisabled(true);
    setButtonText("Uploading...");

    // Create the file reader and prepare to finish reading the data.
    const file = files[0];
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async () => {
      const fileData = new Uint8Array(reader.result);
      let [result, err] = await kernel.callModule(
        "AQBCVx2y7pqsouf2GbLU_etXglcsXZDcWHKs5IiqV0I0DQ",
        "createEncryptedFile",
        {
          fileData,
        }
      );
      let fileKey = result.skylink + result.viewKey;

      // Update the button to let the user pick another file. We do the button
      // update before checking the error.
      setButtonDisabled(false);
      setButtonText("Upload to Skynet");

      // Check the error and fill out the output text.
      setOutputHidden(false);
      if (err !== null) {
        setOutputFileKey("Unable to upload file:", err);
      } else {
        setOutputFileKey(fileKey);
      }
    };
  };

  return (
    <div>
      <input
        type="file"
        id="filePicker"
        style={{ display: "none" }}
        onChange={uploadFile}
      />
      <button
        style={{ margin: "12px" }}
        onClick={buttonFn}
        disabled={buttonDisabled}
      >
        {buttonText}
      </button>
      <p hidden={outputHidden}>{"FileKey: " + outputFileKey}</p>
    </div>
  );
}

// DownloadCard defines the react element that handles downloads.
function DownloadCard(props) {
  // Establish our stateful variables for the button. The default
  // state assumes the kernel is not initialized, which means the
  // button should say 'loading...' and be disabled.
  const [buttonDisabled, setButtonDisabled] = React.useState(true);

  // Establish stateful variables for the output text.
  const [embedHidden, setEmbedHidden] = React.useState(true);
  const [embedSrc, setEmbedSrc] = React.useState("");

  // Establish a function to enable the download button after
  // kernel login is complete.
  React.useEffect(() => {
    async function enableDownloadOnKernelLoad() {
      const err = await kernel.kernelLoaded();
      if (err !== null) {
		// The upload button will handle displaying the error.
        return;
      }
      setButtonDisabled(false);
    }
    enableDownloadOnKernelLoad();
  }, [props]);

  // downloadFile will take the provided skylink and viewkey,
  // perform a download, decrypt the result, and finally load the
  // data in an embedded frame.
  const downloadFile = async () => {
    const downloadFileKey =
      document.getElementById("downloadFileKey").value;
    if (downloadFileKey.length !== 90) {
      alert(
        "FileKey should have length 68, got: " +
          downloadFileKey.length.toString()
      );
      return;
    }
    const skylink = downloadFileKey.slice(0, 46);
    const viewKey = downloadFileKey.slice(46, 90);

	// Disable the button while the download completes.
    setButtonDisabled(true);

	// Perform the download.
    let [result, err] = await kernel.callModule(
      "AQBCVx2y7pqsouf2GbLU_etXglcsXZDcWHKs5IiqV0I0DQ",
      "viewEncryptedFile",
      {
        skylink,
        viewKey,
      }
    );
    if (err !== null) {
      alert(err);
      console.error(err);
      setButtonDisabled(false);
      return;
    }
    const fileData = result.fileData;

    // Create a url from the fileData.
    let url = URL.createObjectURL(new Blob([fileData]));
    setEmbedSrc(url);
    setEmbedHidden(false);

    // Download is complete, re-enable the button.
    setButtonDisabled(false);
    return;
  };

  return (
    <div>
      <label style={{ margin: "12px" }}>Download FileKey</label>
      <input
        style={{ margin: "12px" }}
        type="text"
        id="downloadFileKey"
      />
      <button
        style={{ margin: "12px" }}
        onClick={downloadFile}
        disabled={buttonDisabled}
      >
        {"Download File"}
      </button>
      <br />
      <embed
        src={embedSrc}
        hidden={embedHidden}
        width={"600"}
      ></embed>
    </div>
  );
}

const IndexPage = () => {
  return (
    <main>
      <LoginOrUploadCard />
      <DownloadCard />
    </main>
  );
};

export default IndexPage;

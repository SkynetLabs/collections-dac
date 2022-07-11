import * as React from "react";
import * as kernel from "libkernel";

// LoginOrUploadCard defines an element that will be a login
// button if the user is not logged in, and it will be an upload
// button if the user is logged in.
function LoginOrUploadCard(props) {
  // Establish our stateful variables. The default state assumes
  // the kernel is not initialized, which means the button should
  // say 'loading...' and be disabled.
  const [buttonText, setButtonText] = React.useState("Loading...");
  const [buttonDisabled, setButtonDisabled] = React.useState(true);
  const [buttonFn, setButtonFn] = React.useState(() => () => {});

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
        setButtonText("Unable to Load Skynet: " + err);
        setButtonDisabled(true);
        return;
      }
      setButtonText("Upload to Skynet");
      setButtonDisabled(false);
      setButtonFn(() => () => {
        alert("uploading is not implemented yet");
      });

      // Check for logoutComplete. If logout happens, we reload
      // the page so we can reset the auth flow.
      await kernel.logoutComplete();
      window.location.reload();
    }
    processLoginFlow();
  }, [props]);

  return (
    <div>
      <button
        style={{ margin: "12px" }}
        onClick={buttonFn}
        disabled={buttonDisabled}
      >
        {buttonText}
      </button>
    </div>
  );
}

const IndexPage = () => {
  return (
    <main>
      <LoginOrUploadCard />
    </main>
  );
};

export default IndexPage;

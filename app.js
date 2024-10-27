let previousFileContent = ""; // Variable to store the previously loaded file content

// Function to update the output based on the key-value pairs
function updateOutput(fileName) {
  const safeFileName = fileName.replace(/[^a-zA-Z0-9]/g, "_");
  let imports = "";

  // Gather key-value pairs and domains
  const secretPairs = document.querySelectorAll(".key-value-pair");
  secretPairs.forEach((pair) => {
    const key = pair.querySelector(".secret-key").value.trim();
    const value = pair.querySelector(".secret-value").value.trim() || key; // Use key as value if value is empty
    const domain = pair.querySelector(".secret-domain").value;

    if (key) {
      if (domain === "Secrets") {
        imports += `echo "Initializing ${key}" with vault value\n`;
        imports += `export ${key}=\${{ secrets.${value} }}\n`; // Use value instead of key
        imports += `echo "${key}=\${{ secrets.${value} }}" >> $GITHUB_ENV\n`;
      } else if (domain === "Variables") {
        imports += `echo "Initializing ${key}" to \${{ vars.${value} }}"\n`;
        imports += `export ${key}=\${{ vars.${value} }}\n`;
        imports += `echo "${key}=\${{ vars.${value} }}" >> $GITHUB_ENV\n`;
      } else if (domain === "Runtime") {
        imports += `echo "Initializing ${key}" to ${value}\n`;
        imports += `export ${key}="${value}"\n`;
        imports += `echo "${key}=${value}" >> $GITHUB_ENV\n`;
      }
    }
  });

  // Prepare the content to be prefixed
  let contentToPrefix = "";
  if (previousFileContent) {
    contentToPrefix = `echo "${fileName}" >> EOF\n${previousFileContent}\nEOF`;
  }

  // Construct the output string with the 6-space prefix added later
  const output = `
- name: Generate ${safeFileName}
  run: |${imports ? `\n    ${imports.replace(/\n/g, "\n    ")}` : ""}
    ${contentToPrefix
      .split("\n")
      .map((line) => "" + line)
      .join("\n    ")}
  shell: bash`;

  // Add the 6-space prefix to each line
  const lines = output.split("\n");
  const prefixedLines = lines.map((line) => "      " + line);
  const prefixedOutput = prefixedLines.join("\n");

  // Update the output box
  document.getElementById("outputBox").textContent = prefixedOutput;
}

// Event listener for file input change
document
  .getElementById("fileInput")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previousFileContent = e.target.result; // Store the file content
        updateOutput(file.name); // Update output with file name
      };
      reader.readAsText(file);
    }
  });

// Event listener for adding new secret key-value pairs
document.getElementById("addSecret").addEventListener("click", function () {
  const newPair = document.createElement("div");
  newPair.classList.add("key-value-pair");
  newPair.innerHTML = `
    <input type="text" placeholder="Key" class="secret-key">
    <input type="text" placeholder="Value" class="secret-value">
    <select class="secret-domain">
      <option value="Secrets">Secrets</option>
      <option value="Variables">Variables</option>
      <option value="Runtime">Runtime</option>
    </select>
    <button class="removeSecret">Remove</button>
  `;
  document.getElementById("secretList").appendChild(newPair);

  // Add event listener to remove button
  newPair.querySelector(".removeSecret").addEventListener("click", function () {
    newPair.remove();
    updateOutput(document.getElementById("fileInput").files[0]?.name || ""); // Update output after removing a secret
  });

  // Update output whenever a new secret is added
  updateOutput(document.getElementById("fileInput").files[0]?.name || "");
});

// Event listener for copying output to clipboard
document.getElementById("copyButton").addEventListener("click", function () {
  const outputBox = document.getElementById("outputBox");
  if (outputBox.textContent) {
    navigator.clipboard
      .writeText(outputBox.textContent)
      .then(() => alert("Output copied to clipboard!"))
      .catch((err) => alert("Failed to copy text: ", err));
  }
});

// Event listener for updating output on input change
document.getElementById("secretList").addEventListener("input", function () {
  updateOutput(document.getElementById("fileInput").files[0]?.name || ""); // Use the current file name
});

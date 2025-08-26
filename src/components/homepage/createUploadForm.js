export function createUploadForm({ 
  panelType, 
  fileType = "image", 
  dropAreaId, 
  fileInputId, 
  categoryId, 
  subcategoryId, 
  subsubcategoryId, 
  uploadBtnId 
}) {
  const form = document.createElement("form");
  form.id = `${panelType}-upload-form`;
  form.innerHTML = `
    <div id="${dropAreaId}" class="drop-area">
      <label for="${fileInputId}" class="visually-hidden">Upload ${panelType} File</label>
      <input type="file" id="${fileInputId}" accept="${fileType}/*" title="Choose a ${panelType} file" />
    </div>
    <label for="${categoryId}">Category</label>
    <select id="${categoryId}" required title="Select a primary category"></select>

    <label for="${subcategoryId}">Subcategory</label>
    <select id="${subcategoryId}" title="Select a subcategory"></select>

    <label for="${subsubcategoryId}">Sub-subcategory</label>
    <select id="${subsubcategoryId}" title="Select a sub-subcategory"></select>

    <button id="${uploadBtnId}" type="button">Upload</button>
  `;
  return form;
}

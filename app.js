document.addEventListener("DOMContentLoaded", () => {
  const imageUpload = document.getElementById("imageUpload");
  const imagePreview = document.getElementById("imagePreview");
  const convertButton = document.getElementById("convertButton");
  const pdfSize = document.getElementById("pdfSize");
  const loading = document.getElementById("loading");

  imageUpload.addEventListener("change", handleImageUpload);
  convertButton.addEventListener("click", convertToPDF);

  function handleImageUpload(e) {
    imagePreview.innerHTML = "";
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.classList.add("mb-2");
        imagePreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  async function convertToPDF() {
    if (!imageUpload.files.length) {
      alert("Please select at least one image");
      return;
    }

    loading.classList.remove("hidden");

    try {
      const images = Array.from(imagePreview.getElementsByTagName("img"));
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");

      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();

        const img = images[i];
        const imgData = await processImage(img, pdfSize.value === "compressed");

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pageWidth - 20; // 10mm margins
        const imgHeight = (img.naturalHeight * imgWidth) / img.naturalWidth;

        const x = 10;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);
      }

      pdf.save("converted-images.pdf");
    } catch (error) {
      console.error("Error converting to PDF:", error);
      alert("Error converting images to PDF. " + error.message);
    } finally {
      loading.classList.add("hidden");
    }
  }

  function processImage(img, shouldCompress) {
    return new Promise((resolve) => {
      if (!shouldCompress) {
        resolve(img.src);
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        new Compressor(blob, {
          quality: 0.6,
          maxWidth: 1500,
          success(result) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(result);
          },
        });
      }, "image/jpeg");
    });
  }
});

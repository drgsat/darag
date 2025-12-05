// ▬▬▬▬▬ عناصر DOM ▬▬▬▬▬
let saturate = document.getElementById("saturate");
let contrast = document.getElementById("contrast");
let brightness = document.getElementById("brightness");
let sepia = document.getElementById("sepia");
let grayscale = document.getElementById("grayscale");
let blur = document.getElementById("blur");
let hueRotate = document.getElementById("hue-rotate");

let upload = document.getElementById("upload");
let download = document.getElementById("download");
let img = document.getElementById("img");
let reset = document.getElementById("reset-btn");
let imgBox = document.querySelector('.img-box');
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext('2d');

let loadingSpinner = document.getElementById("loading-spinner");
let darkModeToggle = document.getElementById("dark-mode-toggle");
let undoBtn = document.getElementById("undo-btn");
let redoBtn = document.getElementById("redo-btn");

let filterHistory = [];
let historyIndex = -1;

// ▬▬▬▬▬ دالة تطبيق الفلاتر (للعرض على الشاشة) ▬▬▬▬▬
function applyFilter() {
    canvas.style.filter = `
        saturate(${saturate.value}%)
        contrast(${contrast.value}%)
        brightness(${brightness.value}%)
        sepia(${sepia.value}%)
        grayscale(${grayscale.value})
        blur(${blur.value}px)
        hue-rotate(${hueRotate.value}deg)
    `;
}

// ▬▬▬▬▬ حفظ واسترجاع الفلاتر ▬▬▬▬▬
function saveFilterState() {
    const currentState = {
        saturate: saturate.value,
        contrast: contrast.value,
        brightness: brightness.value,
        sepia: sepia.value,
        grayscale: grayscale.value,
        blur: blur.value,
        hueRotate: hueRotate.value,
    };
    filterHistory = filterHistory.slice(0, historyIndex + 1);
    filterHistory.push(currentState);
    historyIndex++;
    updateHistoryButtons();
}

function loadFilterState(state) {
    saturate.value = state.saturate;
    contrast.value = state.contrast;
    brightness.value = state.brightness;
    sepia.value = state.sepia;
    grayscale.value = state.grayscale;
    blur.value = state.blur;
    hueRotate.value = state.hueRotate;
    
    applyFilter();
}

function updateHistoryButtons() {
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= filterHistory.length - 1;
}

// ▬▬▬▬▬ RESET ▬▬▬▬▬
function resetValue() {
    saturate.value = 100;
    contrast.value = 100;
    brightness.value = 100;
    sepia.value = 0;
    grayscale.value = 0;
    blur.value = 0;
    hueRotate.value = 0;

    canvas.style.filter = "none";
    
    if (img.src && img.style.display === "none") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    filterHistory = [];
    historyIndex = -1;
    updateHistoryButtons();
}

reset.onclick = resetValue;

// ▬▬▬▬▬ Dark Mode ▬▬▬▬▬
window.onload = function() {
    let mainContent = document.getElementById("main-content");
    if (mainContent) {
        mainContent.style.display = "none";
    }

    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
};

darkModeToggle.onclick = function() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
};

// ▬▬▬▬▬ زر الدخول ▬▬▬▬▬
let enterBtn = document.getElementById("enter");
if (enterBtn) {
    enterBtn.onclick = function() {
        let screen = document.getElementById("welcome-screen");
        screen.style.animation = "fadeOut 1s forwards";

        setTimeout(() => {
            screen.style.display = "none";
            document.getElementById("main-content").style.display = "grid";
        }, 900);
    };
}

// ▬▬▬▬▬ رفع الصورة ▬▬▬▬▬
upload.onchange = function() {
    resetValue();
    loadingSpinner.style.display = "block";

    let file = new FileReader();
    file.readAsDataURL(upload.files[0]);

    file.onload = function() {
        img.src = file.result;
    };

    img.onload = function() {
        let maxWidth = window.innerWidth * 0.8;
        let maxHeight = window.innerHeight * 0.6;
        let ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);

        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        img.style.display = "none";
        imgBox.style.display = "block";
        loadingSpinner.style.display = "none";

        saveFilterState();
    };
};

// ▬▬▬▬▬ تطبيق الفلاتر على كل Inputs ▬▬▬▬▬
let filters = document.querySelectorAll("ul li input");
filters.forEach(filter => {
    filter.addEventListener("input", function() {
        imgBox.classList.add('pulse');
        setTimeout(() => { imgBox.classList.remove('pulse'); }, 300);
        applyFilter();
    });
    filter.addEventListener("change", saveFilterState);
});

// ▬▬▬▬▬ دالة تطبيق الفلاتر يدوياً على البكسلات (تعمل على iPhone) ▬▬▬▬▬
function applyFiltersToCanvas(sourceCanvas, filters) {
    let tempCanvas = document.createElement('canvas');
    let tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = sourceCanvas.width;
    tempCanvas.height = sourceCanvas.height;
    
    tempCtx.drawImage(sourceCanvas, 0, 0);
    
    let imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    let data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        
        // 1. Brightness
        let brightnessFactor = filters.brightness / 100;
        r *= brightnessFactor;
        g *= brightnessFactor;
        b *= brightnessFactor;
        
        // 2. Contrast
        let contrastFactor = filters.contrast / 100;
        r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
        g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
        b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;
        
        // 3. Saturate
        let gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        let saturationFactor = filters.saturate / 100;
        r = gray + (r - gray) * saturationFactor;
        g = gray + (g - gray) * saturationFactor;
        b = gray + (b - gray) * saturationFactor;
        
        // 4. Grayscale
        if (filters.grayscale > 0) {
            let grayValue = 0.299 * r + 0.587 * g + 0.114 * b;
            let grayscaleFactor = filters.grayscale;
            r = r * (1 - grayscaleFactor) + grayValue * grayscaleFactor;
            g = g * (1 - grayscaleFactor) + grayValue * grayscaleFactor;
            b = b * (1 - grayscaleFactor) + grayValue * grayscaleFactor;
        }
        
        // 5. Sepia
        if (filters.sepia > 0) {
            let sepiaR = (r * 0.393 + g * 0.769 + b * 0.189);
            let sepiaG = (r * 0.349 + g * 0.686 + b * 0.168);
            let sepiaB = (r * 0.272 + g * 0.534 + b * 0.131);
            let sepiaFactor = filters.sepia / 100;
            r = r * (1 - sepiaFactor) + sepiaR * sepiaFactor;
            g = g * (1 - sepiaFactor) + sepiaG * sepiaFactor;
            b = b * (1 - sepiaFactor) + sepiaB * sepiaFactor;
        }
        
        // 6. Hue Rotate
        if (filters.hueRotate !== 0) {
            let angle = filters.hueRotate * Math.PI / 180;
            let cosA = Math.cos(angle);
            let sinA = Math.sin(angle);  // ✅ تصحيح الخطأ الإملائي
            
            let matrix = [
                cosA + (1 - cosA) / 3, (1 - cosA) / 3 - Math.sqrt(1/3) * sinA, (1 - cosA) / 3 + Math.sqrt(1/3) * sinA,
                (1 - cosA) / 3 + Math.sqrt(1/3) * sinA, cosA + (1 - cosA) / 3, (1 - cosA) / 3 - Math.sqrt(1/3) * sinA,
                (1 - cosA) / 3 - Math.sqrt(1/3) * sinA, (1 - cosA) / 3 + Math.sqrt(1/3) * sinA, cosA + (1 - cosA) / 3
            ];
            
            let newR = r * matrix[0] + g * matrix[1] + b * matrix[2];
            let newG = r * matrix[3] + g * matrix[4] + b * matrix[5];
            let newB = r * matrix[6] + g * matrix[7] + b * matrix[8];
            
            r = newR;
            g = newG;
            b = newB;
        }
        
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
    }
    
    tempCtx.putImageData(imageData, 0, 0);
    
    if (filters.blur > 0) {
        tempCanvas = applyBlur(tempCanvas, filters.blur);
    }
    
    return tempCanvas;
}

// ▬▬▬▬▬ دالة تطبيق Blur يدوياً ▬▬▬▬▬
function applyBlur(canvas, radius) {
    if (radius === 0) return canvas;
    
    let ctx = canvas.getContext('2d');
    let width = canvas.width;
    let height = canvas.height;
    
    let imageData = ctx.getImageData(0, 0, width, height);
    let data = imageData.data;
    
    let originalData = new Uint8ClampedArray(data);
    
    let blurRadius = Math.min(Math.floor(radius), 10);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = 0;
            let count = 0;
            
            for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                    let nx = x + dx;
                    let ny = y + dy;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        let idx = (ny * width + nx) * 4;
                        r += originalData[idx];
                        g += originalData[idx + 1];
                        b += originalData[idx + 2];
                        a += originalData[idx + 3];
                        count++;
                    }
                }
            }
            
            let idx = (y * width + x) * 4;
            data[idx] = r / count;
            data[idx + 1] = g / count;
            data[idx + 2] = b / count;
            data[idx + 3] = a / count;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return canvas;
}

// ▬▬▬▬▬ تحميل الصورة (يعمل على iPhone و Android) ▬▬▬▬▬
download.onclick = function() {
    loadingSpinner.style.display = "block";
    
    setTimeout(() => {
        try {
            let tempCanvas = document.createElement('canvas');
            let tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            
            tempCtx.drawImage(img, 0, 0, img.width, img.height);
            
            let filterValues = {
                saturate: parseFloat(saturate.value),
                contrast: parseFloat(contrast.value),
                brightness: parseFloat(brightness.value),
                sepia: parseFloat(sepia.value),
                grayscale: parseFloat(grayscale.value),
                blur: parseFloat(blur.value),
                hueRotate: parseFloat(hueRotate.value)
            };
            
            let finalCanvas = applyFiltersToCanvas(tempCanvas, filterValues);
            
            download.href = finalCanvas.toDataURL("image/png");
            
            loadingSpinner.style.display = "none";
            
        } catch(error) {
            console.error("خطأ في معالجة الصورة:", error);
            alert("حدث خطأ في معالجة الصورة. حاول مرة أخرى.");
            loadingSpinner.style.display = "none";
        }
    }, 100);
};

// ▬▬▬▬▬ Undo/Redo ▬▬▬▬▬
undoBtn.onclick = function() {
    if (historyIndex > 0) {
        historyIndex--;
        loadFilterState(filterHistory[historyIndex]);
        updateHistoryButtons();
    }
};

redoBtn.onclick = function() {
    if (historyIndex < filterHistory.length - 1) {
        historyIndex++;
        loadFilterState(filterHistory[historyIndex]);
        updateHistoryButtons();
    }
};

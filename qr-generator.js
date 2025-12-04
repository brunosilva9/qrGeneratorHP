// qr-generator.js
// Requirements: npm install qrcode canvas readline-sync fs-extra docx
const QRCode = require("qrcode");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const readline = require("readline-sync");
const { Document, Packer, Paragraph, ImageRun, PageBreak } = require("docx");

// -------------------------
// 1. USER INPUT (with defaults)
// -------------------------
let code = readline.question("Enter two-letter code (default HP): ");
if (!code) code = "HP";

let startRaw = readline.question("Starting number (default 1): ");
let endRaw = readline.question("Ending number (default 20): ");

let start = parseInt(startRaw || "1", 10);
let end = parseInt(endRaw || "20", 10);

if (Number.isNaN(start)) start = 1;
if (Number.isNaN(end)) end = 20;
if (end < start) {
    const temp = start;
    start = end;
    end = temp;
}

// -------------------------
// 2. PREPARE OUTPUT FOLDER
// -------------------------
const outputFolder = "./qr-codes";
fs.ensureDirSync(outputFolder);

// -------------------------
// 3. GENERATE PNG WITH QR + LABEL
// -------------------------
async function generateQR(text, outputFile) {
    // Canvas dimensions - optimized for 4x4 grid
    const canvasWidth = 200;  // Reduced for better fit in 4x4 grid
    const canvasHeight = 250; // Reduced height
    
    // QR code dimensions (square)
    const qrSize = 160;
    const qrMargin = 15; // Space between QR and label border
    
    // Label area dimensions
    const labelHeight = 60;
    const labelMargin = 8; // Internal margin for label
    
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // === QR CODE WITH ROUNDED BORDER ===
    const qrX = (canvasWidth - qrSize) / 2;
    const qrY = 8;
    
    // Rounded border around QR code
    const qrBorderRadius = 8;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#333333";
    
    ctx.beginPath();
    roundRect(ctx, qrX, qrY, qrSize, qrSize, qrBorderRadius);
    ctx.stroke();

    // Generate QR code
    const qrBuffer = await QRCode.toBuffer(text, {
        margin: 1,
        width: qrSize - 6, // Slight margin inside border
        color: {
            dark: "#000000",
            light: "#FFFFFF"
        }
    });

    const qrImage = await loadImage(qrBuffer);
    ctx.drawImage(qrImage, qrX + 3, qrY + 3, qrSize - 6, qrSize - 6);

    // === LABEL AREA WITH ROUNDED RECTANGLE ===
    const labelY = qrY + qrSize + qrMargin;
    const labelWidth = canvasWidth - 30;
    const labelX = (canvasWidth - labelWidth) / 2;
    
    // Draw rounded rectangle for label background
    const labelBorderRadius = 6;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#2C3E50";
    ctx.fillStyle = "#F8F9FA";
    
    ctx.beginPath();
    roundRect(ctx, labelX, labelY, labelWidth, labelHeight, labelBorderRadius);
    ctx.fill();
    ctx.stroke();

    // === LOAD AND DRAW LOGO ===
    try {
        const logo = await loadImage("./logo.png");
        
        // Calculate logo size to maximize without touching QR
        const logoMaxSize = labelHeight - (labelMargin * 2);
        const logoAspectRatio = logo.width / logo.height;
        
        let logoWidth, logoHeight;
        if (logoAspectRatio > 1) {
            // Landscape logo
            logoWidth = Math.min(logoMaxSize, logoMaxSize * logoAspectRatio);
            logoHeight = logoWidth / logoAspectRatio;
        } else {
            // Portrait or square logo
            logoHeight = Math.min(logoMaxSize, logoMaxSize / logoAspectRatio);
            logoWidth = logoHeight * logoAspectRatio;
        }
        
        // Center logo vertically in label
        const logoX = labelX + labelMargin;
        const logoY = labelY + (labelHeight - logoHeight) / 2;
        
        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
        
        // Calculate text position (to the right of logo)
        const textX = logoX + logoWidth + 10;
        
        // === DRAW TEXT ===
        ctx.fillStyle = "#2C3E50";
        ctx.font = "bold 20px Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        
        const textY = labelY + labelHeight / 2;
        ctx.fillText(text, textX, textY);
        
    } catch (error) {
        console.warn("Logo not found or could not be loaded. Drawing text only.");
        
        // Draw text centered if no logo
        ctx.fillStyle = "#2C3E50";
        ctx.font = "bold 24px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvasWidth / 2, labelY + labelHeight / 2);
    }

    // Save PNG
    fs.writeFileSync(outputFile, canvas.toBuffer("image/png"));
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
    if (radius > width / 2) radius = width / 2;
    if (radius > height / 2) radius = height / 2;
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// -------------------------
// 4. CREATE DOCX (Letter) with 4x4 grid optimized for vertical orientation
// -------------------------
async function createDocx(images) {
    // Physical page parameters
    const INCH_TO_TWIP = 1440; // 1 inch = 1440 twips
    const PX_TO_TWIP = 15;     // approximation (1 px ˜ 15 twips)
    
    // Letter size: 8.5 x 11 inches (VERTICAL orientation)
    const PAGE_WIDTH_IN = 8.5;
    const PAGE_HEIGHT_IN = 11;
    
    const PAGE_WIDTH_TWIP = Math.round(PAGE_WIDTH_IN * INCH_TO_TWIP);   // 12240
    const PAGE_HEIGHT_TWIP = Math.round(PAGE_HEIGHT_IN * INCH_TO_TWIP); // 15840
    
    // Optimized margins for 4x4 grid
    const MARGIN_TOP = Math.round(0.3 * INCH_TO_TWIP);    // 0.3 inches top
    const MARGIN_BOTTOM = Math.round(0.3 * INCH_TO_TWIP); // 0.3 inches bottom
    const MARGIN_LEFT = Math.round(0.3 * INCH_TO_TWIP);   // 0.3 inches left
    const MARGIN_RIGHT = Math.round(0.3 * INCH_TO_TWIP);  // 0.3 inches right
    
    const usableWidthTwip = PAGE_WIDTH_TWIP - MARGIN_LEFT - MARGIN_RIGHT;
    const usableHeightTwip = PAGE_HEIGHT_TWIP - MARGIN_TOP - MARGIN_BOTTOM;
    
    // Grid configuration: 4 columns x 4 rows = 16 per page
    const COLUMNS = 4;
    const ROWS = 4;
    const IMAGES_PER_PAGE = COLUMNS * ROWS;
    
    // Image dimensions in pixels (from generateQR function)
    const IMAGE_WIDTH_PX = 200;
    const IMAGE_HEIGHT_PX = 250;
    
    // Convert to twips
    const imageWidthTwip = IMAGE_WIDTH_PX * PX_TO_TWIP;
    const imageHeightTwip = IMAGE_HEIGHT_PX * PX_TO_TWIP;
    
    // Calculate total space needed for grid without spacing
    const totalGridWidth = COLUMNS * imageWidthTwip;
    const totalGridHeight = ROWS * imageHeightTwip;
    
    // Calculate available space for spacing
    const availableWidthForSpacing = usableWidthTwip - totalGridWidth;
    const availableHeightForSpacing = usableHeightTwip - totalGridHeight;
    
    // Calculate spacing between images (distribute evenly)
    const horizontalSpacing = availableWidthForSpacing / (COLUMNS + 1);
    const verticalSpacing = availableHeightForSpacing / (ROWS + 1);
    
    // Build document content
    const docChildren = [];
    
    // Create pages
    for (let page = 0; page < Math.ceil(images.length / IMAGES_PER_PAGE); page++) {
        const startIndex = page * IMAGES_PER_PAGE;
        const endIndex = Math.min(startIndex + IMAGES_PER_PAGE, images.length);
        
        // Create rows for this page
        for (let row = 0; row < ROWS; row++) {
            const rowChildren = [];
            
            // Add initial horizontal spacing
            rowChildren.push(
                new ImageRun({
                    data: Buffer.alloc(0),
                    transformation: {
                        width: Math.round(horizontalSpacing / PX_TO_TWIP),
                        height: 1,
                    },
                })
            );
            
            for (let col = 0; col < COLUMNS; col++) {
                const imageIndex = row * COLUMNS + col;
                const globalIndex = startIndex + imageIndex;
                
                if (globalIndex < endIndex) {
                    const imgBuffer = fs.readFileSync(images[globalIndex].path);
                    rowChildren.push(
                        new ImageRun({
                            data: imgBuffer,
                            transformation: {
                                width: IMAGE_WIDTH_PX,
                                height: IMAGE_HEIGHT_PX,
                            },
                        })
                    );
                } else {
                    // Empty space for missing images
                    rowChildren.push(
                        new ImageRun({
                            data: Buffer.alloc(0),
                            transformation: {
                                width: IMAGE_WIDTH_PX,
                                height: IMAGE_HEIGHT_PX,
                            },
                        })
                    );
                }
                
                // Add horizontal spacing between images (always, including after last image)
                rowChildren.push(
                    new ImageRun({
                        data: Buffer.alloc(0),
                        transformation: {
                            width: Math.round(horizontalSpacing / PX_TO_TWIP),
                            height: 1,
                        },
                    })
                );
            }
            
            // Add row paragraph
            docChildren.push(new Paragraph({ children: rowChildren }));
            
            // Add vertical spacing between rows (except after last row)
            if (row < ROWS - 1) {
                docChildren.push(
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: Buffer.alloc(0),
                                transformation: {
                                    width: 1,
                                    height: Math.round(verticalSpacing / PX_TO_TWIP),
                                },
                            })
                        ]
                    })
                );
            }
        }
        
        // Add page break if not last page
        if (page < Math.ceil(images.length / IMAGES_PER_PAGE) - 1) {
            docChildren.push(new Paragraph({ children: [new PageBreak()] }));
        }
    }
    
    // Create document
    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        size: {
                            width: PAGE_WIDTH_TWIP,
                            height: PAGE_HEIGHT_TWIP,
                        },
                        margin: {
                            top: MARGIN_TOP,
                            right: MARGIN_RIGHT,
                            bottom: MARGIN_BOTTOM,
                            left: MARGIN_LEFT,
                        },
                    },
                },
                children: docChildren,
            },
        ],
    });
    
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(`${outputFolder}/QR_Codes.docx`, buffer);
    
    // Print layout information
    console.log("\n=== DOCUMENT LAYOUT INFORMATION ===");
    console.log(`Page size: ${PAGE_WIDTH_IN}" x ${PAGE_HEIGHT_IN}" (Letter, Vertical)`);
    console.log(`Margins: 0.3" (all sides)`);
    console.log(`Grid: ${COLUMNS} columns x ${ROWS} rows = ${IMAGES_PER_PAGE} per page`);
    console.log(`Image size: ${IMAGE_WIDTH_PX}px x ${IMAGE_HEIGHT_PX}px`);
    console.log(`Horizontal spacing: ${Math.round(horizontalSpacing / PX_TO_TWIP)}px`);
    console.log(`Vertical spacing: ${Math.round(verticalSpacing / PX_TO_TWIP)}px`);
    console.log(`Total pages: ${Math.ceil(images.length / IMAGES_PER_PAGE)}`);
    console.log("===================================\n");
}

// -------------------------
// 5. GENERATE ALL AND CREATE DOCX
// -------------------------
async function generateAll() {
    const images = [];
    console.log("\nGenerating QR codes...\n");
    
    for (let i = start; i <= end; i++) {
        const text = `${code}-${i}`;
        const path = `${outputFolder}/${text}.png`;
        await generateQR(text, path);
        images.push({ text, path });
        console.log("? Generated:", text);
    }
    
    console.log("\nAll PNG files generated. Creating DOCX document with 4x4 grid...\n");
    await createDocx(images);
    console.log("? Complete: document created at", `${outputFolder}/QR_Codes.docx`);
}

// Run the script
generateAll().catch(err => {
    console.error("Error:", err);
});
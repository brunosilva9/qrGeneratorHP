// qr-generator.js
// Requiere: npm install qrcode canvas readline-sync fs-extra docx
const QRCode = require("qrcode");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const readline = require("readline-sync");
const { Document, Packer, Paragraph, ImageRun, PageBreak, Media } = require("docx");

// -------------------------
// 1. PREGUNTAS AL USUARIO (con defaults)
// -------------------------
let codigo = readline.question("Ingresa el codigo de dos letras (default HP): ");
if (!codigo) codigo = "HP";

let inicioRaw = readline.question("Numero inicial (default 1): ");
let finRaw = readline.question("Numero final (default 20): ");

let inicio = parseInt(inicioRaw || "1", 10);
let fin = parseInt(finRaw || "20", 10);

if (Number.isNaN(inicio)) inicio = 1;
if (Number.isNaN(fin)) fin = 20;
if (fin < inicio) {
    const tmp = inicio;
    inicio = fin;
    fin = tmp;
}

// -------------------------
// 2. PREPARAR CARPETA DE SALIDA
// -------------------------
const carpeta = "./qr-codigo";
fs.ensureDirSync(carpeta);

// -------------------------
// 3. GENERAR PNG CON QR + LABEL
// -------------------------
async function generarQR(texto, archivoSalida) {
    const ancho = 256;
    const altoTotal = 316;
    const altoQR = 256;

    const canvas = createCanvas(ancho, altoTotal);
    const ctx = canvas.getContext("2d");

    // Fondo blanco
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, ancho, altoTotal);

    // === Marco redondeado alrededor de todo el QR ===
    const radius = 18;  // radio de las esquinas
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";

    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(ancho - radius, 0);
    ctx.quadraticCurveTo(ancho, 0, ancho, radius);

    ctx.lineTo(ancho, altoTotal - radius);
    ctx.quadraticCurveTo(ancho, altoTotal, ancho - radius, altoTotal);

    ctx.lineTo(radius, altoTotal);
    ctx.quadraticCurveTo(0, altoTotal, 0, altoTotal - radius);

    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.stroke();

    // === GENERAR SOLO EL QR (sin label) ===
    const qrBuffer = await QRCode.toBuffer(texto, {
        margin: 0,
        width: ancho - 20, // leve margen interno para que no toque el borde redondeado
        color: {
            dark: "#000000",
            light: "#FFFFFF"
        }
    });

    const imgQR = await loadImage(qrBuffer);
    ctx.drawImage(imgQR, 10, 10, ancho - 20, altoQR - 20);

    // === Cargar Logo ===
    const logo = await loadImage("./logo.png");

    // Logo: 30×30 px aprox (ajustable)
    const logoSize = 30;

    ctx.drawImage(logo, 20, altoQR + 20, logoSize, logoSize);

    // === Texto del label ===
    ctx.fillStyle = "black";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";

    // Texto alineado a la derecha del logo
    ctx.fillText(texto, 20 + logoSize + 10, altoQR + 43);

    // Guardar PNG
    fs.writeFileSync(archivoSalida, canvas.toBuffer("image/png"));
}


// -------------------------
// 4. CREAR DOCX (Letter) con 8 por página (4x2) y separación
// -------------------------
async function crearDocx(imagenes) {
    // Parámetros físicos de página
    const INCH_TO_TWIP = 1440; // 1 pulgada = 1440 twips
    const PX_TO_TWIP = 15;     // aproximación usada antes (1 px ˜ 15 twip)

    // Carta / Letter: 8.5 x 11 in
    const PAGE_WIDTH_TWIP = Math.round(8.5 * INCH_TO_TWIP);   // 12240
    const PAGE_HEIGHT_TWIP = Math.round(11 * INCH_TO_TWIP);   // 15840

    // Márgenes (puedes ajustar). Usaré 1 cm ~ 0.3937 in -> pero más práctico: 0.7 in
    const MARGIN_LEFT = Math.round(0.7 * INCH_TO_TWIP);
    const MARGIN_RIGHT = MARGIN_LEFT;
    const MARGIN_TOP = Math.round(0.7 * INCH_TO_TWIP);
    const MARGIN_BOTTOM = MARGIN_TOP;

    const usableWidthTwip = PAGE_WIDTH_TWIP - MARGIN_LEFT - MARGIN_RIGHT;
    const usableHeightTwip = PAGE_HEIGHT_TWIP - MARGIN_TOP - MARGIN_BOTTOM;

    // Layout deseado: 4 columnas x 2 filas = 8 por página
    const COLS = 4;
    const ROWS = 2;
    const MAX_PER_PAGE = COLS * ROWS;

    // Separación entre imágenes (en px)
    const SPACING_PX = 12; // separación pequeña
    const SPACING_TWIP = SPACING_PX * PX_TO_TWIP;

    // Original PNG size en px (generados)
    const ORIG_W_PX = 256;
    const ORIG_H_PX = 316;

    // Convertir usable width a px usando la aproximación (twip -> px)
    const usableWidthPx = Math.floor(usableWidthTwip / PX_TO_TWIP);
    const usableHeightPx = Math.floor(usableHeightTwip / PX_TO_TWIP);

    // Calcular ancho máximo por columna considerando espacios entre columnas
    // totalSpacingHorizontal en px = (COLS - 1) * SPACING_PX
    const totalSpacingH = (COLS - 1) * SPACING_PX;
    const maxWidthPerColPx = Math.floor((usableWidthPx - totalSpacingH) / COLS);

    // Para las filas, calcular altura disponible por fila considerando espacio vertical entre filas
    const totalSpacingV = (ROWS - 1) * SPACING_PX;
    const maxHeightPerRowPx = Math.floor((usableHeightPx - totalSpacingV) / ROWS);

    // Escalar las imágenes (manteniendo proporción)
    const scale = Math.min(maxWidthPerColPx / ORIG_W_PX, maxHeightPerRowPx / ORIG_H_PX, 1);
    const targetW = Math.round(ORIG_W_PX * scale);
    const targetH = Math.round(ORIG_H_PX * scale);

    // Construir el contenido del documento por páginas
    const docChildren = [];

    for (let p = 0; p < Math.ceil(imagenes.length / MAX_PER_PAGE); p++) {
        const start = p * MAX_PER_PAGE;
        const end = Math.min(start + MAX_PER_PAGE, imagenes.length);
        const pageImgs = imagenes.slice(start, end);

        // Construir ROWS párrafos (cada fila será un Paragraph con Children combinados)
        for (let r = 0; r < ROWS; r++) {
            const rowStartIndex = r * COLS;
            const children = [];

            for (let c = 0; c < COLS; c++) {
                const idx = r * COLS + c;
                const globalIdx = start + idx;
                if (globalIdx < end) {
                    const imgBuf = fs.readFileSync(imagenes[globalIdx].path);
                    children.push(
                        new ImageRun({
                            data: imgBuf,
                            transformation: {
                                width: targetW,
                                height: targetH,
                            },
                        })
                    );
                } else {
                    // Si no existe imagen (por ejemplo última página incompleta), insertar un espacio vacío
                    // Se añade un empty run pequeño para mantener la estructura
                    children.push(
                        new ImageRun({
                            data: Buffer.alloc(0),
                            transformation: {
                                width: targetW,
                                height: targetH,
                            },
                        })
                    );
                }

                // Espacio entre columnas (no al final)
                if (c !== COLS - 1) {
                    // Insertar un "espaciador" en forma de ImageRun vacío con ancho SPACING_PX
                    children.push(
                        new ImageRun({
                            data: Buffer.alloc(0),
                            transformation: {
                                width: SPACING_PX,
                                height: targetH,
                            },
                        })
                    );
                }
            }

            // Añadir la fila como párrafo
            docChildren.push(new Paragraph({ children: children }));

            // Espacio vertical entre filas (small)
            if (r !== ROWS - 1) {
                // Añadir un párrafo vacío con altura de separación
                docChildren.push(new Paragraph({}));
            }
        }

        // Si no es la última página, insertar salto de página
        if (p !== Math.floor((imagenes.length - 1) / MAX_PER_PAGE)) {
            docChildren.push(new Paragraph({ children: [new PageBreak()] }));
        }
    }

    // Crear documento con tamaños de página y márgenes
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
    fs.writeFileSync(`${carpeta}/QRs.docx`, buffer);
}

// -------------------------
// 5. GENERAR TODOS Y CREAR DOCX
// -------------------------
async function generarTodos() {
    const imagenes = [];
    console.log("\nGenerando QR...\n");

    for (let i = inicio; i <= fin; i++) {
        const texto = `${codigo}-${i}`;
        const path = `${carpeta}/${texto}.png`;
        await generarQR(texto, path);
        imagenes.push({ texto, path });
        console.log("? Generado:", texto);
    }

    console.log("\nGenerados todos los PNG. Ahora creando DOCX...\n");
    await crearDocx(imagenes);
    console.log("?? Listo: archivo creado en", `${carpeta}/QRs.docx`);
}

generarTodos().catch(err => {
    console.error("Error:", err);
});

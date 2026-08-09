import { registerModule } from "./modules/registry.js";

// --- register every tool module here. Adding a new tool = one import + one line. ---
import pdfCompress from "./modules/pdfCompress.js";
import bgRemove from "./modules/bgRemove.js";
import youtubeDownload from "./modules/youtubeDownload.js";
import mp4ToMp3 from "./modules/mp4ToMp3.js";
import imageConvert from "./modules/imageConvert.js";
import videoTrim from "./modules/videoTrim.js";
import videoCompress from "./modules/videoCompress.js";
import videoToGif from "./modules/videoToGif.js";
import audioConvert from "./modules/audioConvert.js";
import ocr from "./modules/ocr.js";
import markdownToPdf from "./modules/markdownToPdf.js";

// --- new tools added in the expansion ---
import pdfMerge from "./modules/pdfMerge.js";
import pdfSplit from "./modules/pdfSplit.js";
import pdfExtractText from "./modules/pdfExtractText.js";
import pdfWatermark from "./modules/pdfWatermark.js";
import imagesToPdf from "./modules/imagesToPdf.js";
import pdfToImages from "./modules/pdfToImages.js";
import pdfProtect from "./modules/pdfProtect.js";
import docxToPdf from "./modules/docxToPdf.js";
import pdfToDocx from "./modules/pdfToDocx.js";

import imageCrop from "./modules/imageCrop.js";
import imageStripExif from "./modules/imageStripExif.js";
import imageToFavicon from "./modules/imageToFavicon.js";
import imageCollage from "./modules/imageCollage.js";
import imageUpscale from "./modules/imageUpscale.js";

import videoMerge from "./modules/videoMerge.js";
import videoThumbnail from "./modules/videoThumbnail.js";
import videoRotate from "./modules/videoRotate.js";
import videoWaveform from "./modules/videoWaveform.js";
import videoSubtitles from "./modules/videoSubtitles.js";

import audioTrim from "./modules/audioTrim.js";
import audioMerge from "./modules/audioMerge.js";
import audioNormalize from "./modules/audioNormalize.js";
import audioSpeed from "./modules/audioSpeed.js";

import csvToJson from "./modules/csvToJson.js";
import jsonToCsv from "./modules/jsonToCsv.js";
import qrGenerate from "./modules/qrGenerate.js";
import qrRead from "./modules/qrRead.js";
import textDiff from "./modules/textDiff.js";
import textCaseConvert from "./modules/textCaseConvert.js";

import pinterestDownload from "./modules/pinterestDownload.js";
import spotifyDownload from "./modules/spotifyDownload.js";

// --- iLovePDF-beating PDF tools ---
import pdfOrganize from "./modules/pdfOrganize.js";
import pdfPageNumbers from "./modules/pdfPageNumbers.js";
import pdfRepair from "./modules/pdfRepair.js";
import pdfRedact from "./modules/pdfRedact.js";
import signPdf from "./modules/signPdf.js";
import scanToPdf from "./modules/scanToPdf.js";
import excelToPdf from "./modules/excelToPdf.js";
import pptToPdf from "./modules/pptToPdf.js";
import pdfToExcel from "./modules/pdfToExcel.js";
import pdfToPpt from "./modules/pdfToPpt.js";
import pdfCompare from "./modules/pdfCompare.js";
import htmlToPdf from "./modules/htmlToPdf.js";

// --- everyday utility tools ---
import jsonFormat from "./modules/jsonFormat.js";
import base64Convert from "./modules/base64Convert.js";
import urlConvert from "./modules/urlConvert.js";
import hashGenerate from "./modules/hashGenerate.js";
import uuidGenerate from "./modules/uuidGenerate.js";
import loremIpsumGenerate from "./modules/loremIpsumGenerate.js";
import wordCounter from "./modules/wordCounter.js";
import regexTester from "./modules/regexTester.js";
import passwordGenerate from "./modules/passwordGenerate.js";
import unitConvert from "./modules/unitConvert.js";
import bmiCalculate from "./modules/bmiCalculate.js";
import barcodeGenerate from "./modules/barcodeGenerate.js";
import imageCompress from "./modules/imageCompress.js";
import memeGenerate from "./modules/memeGenerate.js";
import imageColorPalette from "./modules/imageColorPalette.js";
import imageWatermark from "./modules/imageWatermark.js";
import imageAddBorder from "./modules/imageAddBorder.js";
import audioSilenceRemove from "./modules/audioSilenceRemove.js";
import videoWatermark from "./modules/videoWatermark.js";
import gifCompress from "./modules/gifCompress.js";
import duplicateFinder from "./modules/duplicateFinder.js";
import pdfFormExtract from "./modules/pdfFormExtract.js";
import pdfFormFill from "./modules/pdfFormFill.js";

registerModule(pdfCompress);
registerModule(bgRemove);
registerModule(youtubeDownload);
registerModule(mp4ToMp3);
registerModule(imageConvert);
registerModule(videoTrim);
registerModule(videoCompress);
registerModule(videoToGif);
registerModule(audioConvert);
registerModule(ocr);
registerModule(markdownToPdf);

registerModule(pdfMerge);
registerModule(pdfSplit);
registerModule(pdfExtractText);
registerModule(pdfWatermark);
registerModule(imagesToPdf);
registerModule(pdfToImages);
registerModule(pdfProtect);
registerModule(docxToPdf);
registerModule(pdfToDocx);

registerModule(imageCrop);
registerModule(imageStripExif);
registerModule(imageToFavicon);
registerModule(imageCollage);
registerModule(imageUpscale);

registerModule(videoMerge);
registerModule(videoThumbnail);
registerModule(videoRotate);
registerModule(videoWaveform);
registerModule(videoSubtitles);

registerModule(audioTrim);
registerModule(audioMerge);
registerModule(audioNormalize);
registerModule(audioSpeed);

registerModule(csvToJson);
registerModule(jsonToCsv);
registerModule(qrGenerate);
registerModule(qrRead);
registerModule(textDiff);
registerModule(textCaseConvert);

registerModule(pinterestDownload);
registerModule(spotifyDownload);

registerModule(pdfOrganize);
registerModule(pdfPageNumbers);
registerModule(pdfRepair);
registerModule(pdfRedact);
registerModule(signPdf);
registerModule(scanToPdf);
registerModule(excelToPdf);
registerModule(pptToPdf);
registerModule(pdfToExcel);
registerModule(pdfToPpt);
registerModule(pdfCompare);
registerModule(htmlToPdf);

registerModule(jsonFormat);
registerModule(base64Convert);
registerModule(urlConvert);
registerModule(hashGenerate);
registerModule(uuidGenerate);
registerModule(loremIpsumGenerate);
registerModule(wordCounter);
registerModule(regexTester);
registerModule(passwordGenerate);
registerModule(unitConvert);
registerModule(bmiCalculate);
registerModule(barcodeGenerate);
registerModule(imageCompress);
registerModule(memeGenerate);
registerModule(imageColorPalette);
registerModule(imageWatermark);
registerModule(imageAddBorder);
registerModule(audioSilenceRemove);
registerModule(videoWatermark);
registerModule(gifCompress);
registerModule(duplicateFinder);
registerModule(pdfFormExtract);
registerModule(pdfFormFill);

export function ensureModulesRegistered() {}

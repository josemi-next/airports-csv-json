// Script que genera un enum con IATA CODES y otro con los nombres
// Solo es necesario instalar la libreria csv-parse, el resto es nativo de Node
const { parse } = require("csv-parse");
const { createReadStream } = require("fs");
const { writeFile } = require("fs/promises");
const { pipeline } = require("stream");

const dateNow = new Date();

const CSV_URL =
  "https://github.com/opentraveldata/opentraveldata/raw/master/opentraveldata/optd_por_public.csv";
const WRITE_CSV_PATH = `./airports-${dateNow.getDate()}-${
  dateNow.getMonth() + 1
}-${dateNow.getFullYear()}.csv`;
const WRITE_JSON_PATH = `./airports-${dateNow.getDate()}-${
  dateNow.getMonth() + 1
}-${dateNow.getFullYear()}.json`;
const LABEL_ENUM_PATH = `./airports-${dateNow.getDate()}-${
  dateNow.getMonth() + 1
}-${dateNow.getFullYear()}-labels.enum.ts`;
const IATA_ENUM_PATH = `./airports-${dateNow.getDate()}-${
  dateNow.getMonth() + 1
}-${dateNow.getFullYear()}-iata.enum.ts`;

const bootstrap = async () => {
  const res = await fetch(CSV_URL);

  if (!res.ok) throw new Error("Download CSV error");

  const csvData = await res.text();
  await writeFile(WRITE_CSV_PATH, csvData);

  const results = {};
  let labelEnumResult = "export enum AirportLabels {";
  let iataEnumResult = "export enum Airports {";

  const readStream = createReadStream(WRITE_CSV_PATH);

  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    delimiter: "^",
  });

  parser.on("data", (record) => {
    if (!record.iata_code || !record.icao_code) return;
    if (results[record.iata_code]) return;

    labelEnumResult += `${record.iata_code} = '${record.name.replaceAll(
      "'",
      "\\'"
    )}',\n`;

    iataEnumResult += `${record.iata_code} = '${record.iata_code.replaceAll(
      "'",
      "\\'"
    )}',\n`;

    results[record.iata_code] = record.timezone;
  });

  parser.on("end", async () => {
    labelEnumResult += "}";
    iataEnumResult += "}";

    await writeFile(WRITE_JSON_PATH, JSON.stringify(results));
    await writeFile(LABEL_ENUM_PATH, labelEnumResult);
    await writeFile(IATA_ENUM_PATH, iataEnumResult);
  });

  pipeline(readStream, parser, (err) => console.error(err));
};

bootstrap();

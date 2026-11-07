import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import { emptyLedger, parseLedger, type Ledger } from "./table";

const FILE_NAME = "riichi-ledger.json";

export function useLedger() {
  const [ledger, setLedger] = useState<Ledger>(emptyLedger);
  const [ready, setReady] = useState(false);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let live = true;
    loadLedger().then((value) => {
      if (!live) return;
      setLedger(value);
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const snapshot = ledger;
    writes.current = writes.current.then(() => saveLedger(snapshot)).catch(() => undefined);
  }, [ledger, ready]);

  return { ledger, setLedger, ready };
}

export async function loadLedger(): Promise<Ledger> {
  try {
    return parseLedger(await readRaw());
  } catch {
    return emptyLedger();
  }
}

export async function saveLedger(ledger: Ledger): Promise<void> {
  await writeRaw(JSON.stringify(ledger));
}

async function readRaw(): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(FILE_NAME);
  }
  const file = ledgerFile();
  if (!file.exists) return null;
  return file.text();
}

async function writeRaw(raw: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(FILE_NAME, raw);
    return;
  }
  const file = ledgerFile();
  if (!file.exists) file.create();
  await file.write(raw);
}

function ledgerFile(): File {
  return new File(Paths.document, FILE_NAME);
}

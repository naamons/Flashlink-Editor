import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";

// --- Types ---
export interface ECUFieldValues {
  Name: string;
  Unit: string;
  Factor: string;
  Offset: string;
  StartAddr: string;
  "StartAddr.Cpu"?: string;
}

export interface ECUAxis {
  Name: string;
  IdName: string;
  Unit: string;
  Factor: string;
  Offset: string;
  Radix: string;
  bBackwards: string;
  bReciprocal: string;
  bSigned: string;
  Precision: string;
  DataSrc: string;
  DataHeader: string;
  DataAddr: string;
  "DataAddr.Cpu"?: string;
  DataOrg: string;
  SignatureByte: string;
  SkipBytes: string;
}

export interface ECUMap {
  Name: string;
  IdName: string;
  FolderName: string;
  Type: string;
  ViewMode: string;
  RWin: string;
  DataOrg: string;
  bReciprocal: string;
  bSigned: string;
  bDelta: string;
  bPercent: string;
  bOriginal: string;
  bOriginalValues: string;
  Columns: string;
  Rows: string;
  Radix: string;
  Comment: string;
  Precision: string;
  SkipBytes: string;
  LineSkipBytes: string;
  ValueRangeMin: string;
  ValueRangeMax: string;
  ValueRangeLock: string;
  Marker: string;
  Fieldvalues: ECUFieldValues;
  AxisX: ECUAxis;
  AxisY: ECUAxis;
}

export interface FolderNode {
  name: string;
  maps: ECUMap[];
  folders: Record<string, FolderNode>;
  isOpen?: boolean;
}

// --- Linked group ---
export interface LinkedGroup {
  id: string;
  mapIds: string[];
  mode: 'percent' | 'absolute';
}

// --- Project / Version ---
export interface ProjectVersion {
  name: string;
  timestamp: number;
  binBase64: string;
}

export interface Project {
  name: string;
  ecuDef: string;
  vehicleDetails: string;
  customerInfo: string;
  calibrationId: string;
  versions: ProjectVersion[];
  activeVersionIdx: number;
}

// --- Context State Type ---
interface EditorState {
  // Data
  isLoading: boolean;
  mapsDict: Record<string, ECUMap>;
  rootFolder: FolderNode;
  originalBin: Uint8Array | null;
  editedBin: Uint8Array | null;
  compareBin: Uint8Array | null;

  // UI State
  selectedMap: ECUMap | null;
  openTabs: ECUMap[];
  activeTabId: string | null;
  hexViewerOffset: number;

  // Undo/Redo
  undoCount: number;
  redoCount: number;

  // Linked maps
  linkedGroups: LinkedGroup[];

  // Project management
  currentProject: Project | null;
  savedProjects: Project[];

  // Actions
  loadData: () => Promise<void>;
  loadDemoMode: () => Promise<void>;
  setSelectedMap: (map: ECUMap | null) => void;
  openMapTab: (map: ECUMap) => void;
  closeMapTab: (mapId: string) => void;
  updateBinData: (address: number, data: Uint8Array) => void;
  updateBinDataBatch: (updates: {address: number, data: Uint8Array}[], sourceMapId?: string) => void;
  setHexViewOffset: (addr: number) => void;
  toggleFolder: (folderPath: string[]) => void;
  renameMap: (idName: string, newName: string) => void;
  renameFolder: (path: string[], newName: string) => void;
  exportBin: () => void;
  generateScript: () => void;
  loadCustomBin: (buffer: ArrayBuffer) => void;
  loadCompareBin: (buffer: ArrayBuffer) => void;
  undoAll: () => void;
  closeAllTabs: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;

  // Linked maps
  linkMaps: (mapIds: string[], mode: 'percent' | 'absolute') => void;
  unlinkMaps: (groupId: string) => void;
  getLinkedGroup: (mapId: string) => LinkedGroup | undefined;

  // Project management
  saveProject: (name: string) => void;
  loadProject: (name: string) => void;
  deleteProject: (name: string) => void;
  saveVersion: (versionName: string) => void;
  loadVersion: (idx: number) => void;
  getAllProjectNames: () => string[];
}

const EditorContext = createContext<EditorState | null>(null);

function buildFolderTree(maps: ECUMap[]): FolderNode {
  const root: FolderNode = {
    name: "Root",
    maps: [],
    folders: {},
    isOpen: true,
  };

  maps.forEach((map) => {
    const paths = map.FolderName
      ? map.FolderName.split("\\").map((s) => s.trim())
      : ["Uncategorized"];
    let current = root;
    paths.forEach((p) => {
      if (!current.folders[p]) {
        current.folders[p] = { name: p, maps: [], folders: {}, isOpen: false };
      }
      current = current.folders[p];
    });
    current.maps.push(map);
  });

  return root;
}

// --- Helpers for project persistence ---
function uint8ToBase64(u8: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const u8 = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i);
  return u8;
}

const MAX_UNDO = 50;

export function EditorProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [rootFolder, setRootFolder] = useState<FolderNode>({
    name: "Root",
    maps: [],
    folders: {},
  });
  const [mapsDict, setMapsDict] = useState<Record<string, ECUMap>>({});

  const [originalBin, setOriginalBin] = useState<Uint8Array | null>(null);
  const [editedBin, setEditedBin] = useState<Uint8Array | null>(null);
  const [compareBin, setCompareBin] = useState<Uint8Array | null>(null);

  const [selectedMap, setSelectedMap] = useState<ECUMap | null>(null);
  const [openTabs, setOpenTabs] = useState<ECUMap[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [hexViewerOffset, setHexViewerOffset] = useState(0);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<Uint8Array[]>([]);
  const [redoStack, setRedoStack] = useState<Uint8Array[]>([]);

  // Linked map groups
  const [linkedGroups, setLinkedGroups] = useState<LinkedGroup[]>([]);

  // Project management
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [savedProjects, setSavedProjects] = useState<Project[]>(() => {
    try {
      const raw = localStorage.getItem('ecu-projects');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  // Persist projects
  useEffect(() => {
    try {
      localStorage.setItem('ecu-projects', JSON.stringify(savedProjects));
    } catch { /* storage full — silently fail */ }
  }, [savedProjects]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const resJson = await fetch("/maps.json");
      const jsonData = await resJson.json();

      const flatMaps: ECUMap[] = [];
      const rawMaps = jsonData.maps || [];
      const dict: Record<string, ECUMap> = {};

      const parseObj = (raw: Record<string, unknown>): ECUMap => {
        const m = { Fieldvalues: {} as Record<string, unknown>, AxisX: {} as Record<string, unknown>, AxisY: {} as Record<string, unknown> } as Record<string, unknown>;
        Object.keys(raw).forEach((k) => {
          if (k.startsWith("Fieldvalues.")) (m.Fieldvalues as Record<string, unknown>)[k.split(".")[1]] = raw[k];
          else if (k.startsWith("AxisX.")) (m.AxisX as Record<string, unknown>)[k.split(".")[1]] = raw[k];
          else if (k.startsWith("AxisY.")) (m.AxisY as Record<string, unknown>)[k.split(".")[1]] = raw[k];
          else m[k] = raw[k];
        });
        return m as unknown as ECUMap;
      };

      rawMaps.forEach((rm: Record<string, unknown>) => {
        const parsed = parseObj(rm);
        flatMaps.push(parsed);
        if (parsed.IdName) dict[parsed.IdName] = parsed;
        else dict[parsed.Name] = parsed;
      });

      setMapsDict(dict);
      setRootFolder(buildFolderTree(flatMaps));

      const resBin = await fetch("/data.bin");
      const arrayBuffer = await resBin.arrayBuffer();
      const u8 = new Uint8Array(arrayBuffer);
      setOriginalBin(u8);
      setEditedBin(new Uint8Array(u8));
      setUndoStack([]);
      setRedoStack([]);
    } catch (e) {
      console.error("Failed to load ECU files:", e);
      alert("Error loading Map Data. Make sure the public files are present.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDemoMode = useCallback(async () => {
    setIsLoading(true);
    try {
      const mapsUrl = supabase.storage.from('demo_files').getPublicUrl('maps.json').data.publicUrl;
      const binUrl = supabase.storage.from('demo_files').getPublicUrl('data.bin').data.publicUrl;

      // Use the newly copied demo files from Supabase CDN
      const resJson = await fetch(mapsUrl);
      const jsonData = await resJson.json();

      const flatMaps: ECUMap[] = [];
      const rawMaps = jsonData.maps || [];
      const dict: Record<string, ECUMap> = {};

      const parseObj = (raw: Record<string, unknown>): ECUMap => {
        const m = { Fieldvalues: {} as Record<string, unknown>, AxisX: {} as Record<string, unknown>, AxisY: {} as Record<string, unknown> } as Record<string, unknown>;
        Object.keys(raw).forEach((k) => {
          if (k.startsWith("Fieldvalues.")) (m.Fieldvalues as Record<string, unknown>)[k.split(".")[1]] = raw[k];
          else if (k.startsWith("AxisX.")) (m.AxisX as Record<string, unknown>)[k.split(".")[1]] = raw[k];
          else if (k.startsWith("AxisY.")) (m.AxisY as Record<string, unknown>)[k.split(".")[1]] = raw[k];
          else m[k] = raw[k];
        });
        return m as unknown as ECUMap;
      };

      rawMaps.forEach((rm: Record<string, unknown>) => {
        const parsed = parseObj(rm);
        flatMaps.push(parsed);
        if (parsed.IdName) dict[parsed.IdName] = parsed;
        else dict[parsed.Name] = parsed;
      });

      setMapsDict(dict);
      setRootFolder(buildFolderTree(flatMaps));

      const resBin = await fetch(binUrl);
      const arrayBuffer = await resBin.arrayBuffer();
      const u8 = new Uint8Array(arrayBuffer);
      setOriginalBin(u8);
      setEditedBin(new Uint8Array(u8));
      setUndoStack([]);
      setRedoStack([]);

      // Auto-populate a dummy project for Demo Mode
      setCurrentProject({
        name: 'Veloster N Demo',
        ecuDef: 'SIM2K-250',
        vehicleDetails: 'Hyundai Veloster N',
        customerInfo: 'Demo User',
        calibrationId: 'VELO_DEMO',
        versions: [{
          name: 'Original Load',
          timestamp: Date.now(),
          binBase64: uint8ToBase64(u8),
        }],
        activeVersionIdx: 0,
      });

    } catch (e) {
      console.error("Failed to load Demo Data:", e);
      alert("Error loading Demo Map Data. Make sure the demo files are in public/demo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      loadDemoMode();
    } else {
      loadData();
    }
  }, [loadData, loadDemoMode]);

  const openMapTab = (map: ECUMap) => {
    const id = map.IdName || map.Name;
    if (!openTabs.find((t) => (t.IdName || t.Name) === id)) {
      setOpenTabs([...openTabs, map]);
    }
    setActiveTabId(id);
  };

  const closeMapTab = (mapId: string) => {
    const newTabs = openTabs.filter((t) => (t.IdName || t.Name) !== mapId);
    setOpenTabs(newTabs);
    if (activeTabId === mapId) {
      setActiveTabId(
        newTabs.length > 0 ? newTabs[0].IdName || newTabs[0].Name : null,
      );
    }
  };

  // --- Push undo before mutation ---
  const pushUndo = (bin: Uint8Array) => {
    setUndoStack(prev => {
      const next = [...prev, new Uint8Array(bin)];
      if (next.length > MAX_UNDO) next.shift();
      return next;
    });
    setRedoStack([]);
  };

  const updateBinData = (address: number, data: Uint8Array) => {
    if (!editedBin) return;
    pushUndo(editedBin);
    const newBin = new Uint8Array(editedBin);
    newBin.set(data, address);
    setEditedBin(newBin);
  };

  const updateBinDataBatch = (updates: {address: number, data: Uint8Array}[]) => {
    if (!editedBin) return;
    pushUndo(editedBin);
    const newBin = new Uint8Array(editedBin);
    updates.forEach(u => newBin.set(u.data, u.address));
    setEditedBin(newBin);
    // TODO: linked map propagation would go here
    // If sourceMapId is in a linked group, compute deltas and apply to other maps
  };

  const undo = useCallback(() => {
    if (undoStack.length === 0 || !editedBin) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setRedoStack(s => [...s, new Uint8Array(editedBin)]);
    setEditedBin(prev);
  }, [undoStack, editedBin]);

  const redo = useCallback(() => {
    if (redoStack.length === 0 || !editedBin) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(s => s.slice(0, -1));
    setUndoStack(s => [...s, new Uint8Array(editedBin)]);
    setEditedBin(next);
  }, [redoStack, editedBin]);

  const toggleFolder = (path: string[]) => {
    const newRoot = { ...rootFolder };
    let current = newRoot;
    for (const p of path) {
      if (current.folders[p]) current = current.folders[p];
    }
    current.isOpen = !current.isOpen;
    setRootFolder(newRoot);
  };

  const renameMap = (idName: string, newName: string) => {
    if (!newName.trim()) return;
    if (mapsDict[idName]) {
      const upDict = { ...mapsDict };
      upDict[idName] = { ...upDict[idName], Name: newName };
      setMapsDict(upDict);
    }
    const newRoot = { ...rootFolder };
    const traverse = (node: FolderNode) => {
      node.maps = node.maps.map(m => (m.IdName || m.Name) === idName ? { ...m, Name: newName } : m);
      Object.values(node.folders).forEach(traverse);
    };
    traverse(newRoot);
    setRootFolder(newRoot);
    setOpenTabs(tabs => tabs.map(t => (t.IdName || t.Name) === idName ? { ...t, Name: newName } : t));
  };

  const renameFolder = (path: string[], newName: string) => {
    if (!newName.trim()) return;
    const newRoot = { ...rootFolder };
    let current = newRoot;
    let parent: FolderNode | null = null;
    const targetName = path[path.length - 1];
    for (let i = 0; i < path.length; i++) {
      parent = current;
      current = current.folders[path[i]];
    }
    if (current && parent) {
      current.name = newName;
      parent.folders[newName] = current;
      delete parent.folders[targetName];
      setRootFolder(newRoot);
    }
  };

  const exportBin = useCallback(() => {
    if (!editedBin) return;
    const blob = new Blob([editedBin as BlobPart], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Modified_" + Date.now() + ".bin";
    a.click();
    URL.revokeObjectURL(url);
  }, [editedBin]);

  const generateScript = useCallback(() => {
    if (!originalBin || !editedBin) return;
    const diffs: { addr: string, orig: string, new: string }[] = [];
    for (let i = 0; i < originalBin.length; i++) {
      if (originalBin[i] !== editedBin[i]) {
        diffs.push({
          addr: "0x" + i.toString(16).toUpperCase(),
          orig: "0x" + originalBin[i].toString(16).toUpperCase().padStart(2, '0'),
          new: "0x" + editedBin[i].toString(16).toUpperCase().padStart(2, '0')
        });
      }
    }
    if (diffs.length === 0) {
      alert("No changes detected since original load.");
      return;
    }
    const scriptJson = JSON.stringify({ diffs }, null, 2);
    const blob = new Blob([scriptJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ScriptDiff_" + Date.now() + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }, [originalBin, editedBin]);

  const loadCustomBin = useCallback((buffer: ArrayBuffer) => {
    const u8 = new Uint8Array(buffer);
    setOriginalBin(u8);
    setEditedBin(new Uint8Array(u8));
    setCompareBin(null);
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const loadCompareBin = useCallback((buffer: ArrayBuffer) => {
    const u8 = new Uint8Array(buffer);
    setCompareBin(u8);
  }, []);

  const undoAll = useCallback(() => {
    if (originalBin && editedBin) {
      pushUndo(editedBin);
      setEditedBin(new Uint8Array(originalBin));
    }
  }, [originalBin, editedBin]);

  const closeAllTabs = useCallback(() => {
    setOpenTabs([]);
    setActiveTabId(null);
  }, []);

  // --- Linked maps ---
  const linkMaps = useCallback((mapIds: string[], mode: 'percent' | 'absolute') => {
    const id = 'lg-' + Date.now();
    setLinkedGroups(prev => [...prev, { id, mapIds, mode }]);
  }, []);

  const unlinkMaps = useCallback((groupId: string) => {
    setLinkedGroups(prev => prev.filter(g => g.id !== groupId));
  }, []);

  const getLinkedGroup = useCallback((mapId: string) => {
    return linkedGroups.find(g => g.mapIds.includes(mapId));
  }, [linkedGroups]);

  // --- Project management ---
  const saveProject = useCallback((name: string) => {
    if (!editedBin) return;
    const proj: Project = {
      name,
      ecuDef: 'SIM2K-250',
      vehicleDetails: '2024 Hyundai Elantra N (DPE)',
      customerInfo: 'Nathan Amons',
      calibrationId: 'CNPNKM__FT5A',
      versions: [{
        name: 'Initial',
        timestamp: Date.now(),
        binBase64: uint8ToBase64(editedBin),
      }],
      activeVersionIdx: 0,
    };
    setCurrentProject(proj);
    setSavedProjects(prev => {
      const filtered = prev.filter(p => p.name !== name);
      return [...filtered, proj];
    });
  }, [editedBin]);

  const loadProject = useCallback((name: string) => {
    const proj = savedProjects.find(p => p.name === name);
    if (!proj || proj.versions.length === 0) return;
    setCurrentProject(proj);
    const ver = proj.versions[proj.activeVersionIdx];
    const u8 = base64ToUint8(ver.binBase64);
    setOriginalBin(u8);
    setEditedBin(new Uint8Array(u8));
    setUndoStack([]);
    setRedoStack([]);
  }, [savedProjects]);

  const deleteProject = useCallback((name: string) => {
    setSavedProjects(prev => prev.filter(p => p.name !== name));
    if (currentProject?.name === name) setCurrentProject(null);
  }, [currentProject]);

  const saveVersion = useCallback((versionName: string) => {
    if (!editedBin || !currentProject) return;
    const newVer: ProjectVersion = {
      name: versionName,
      timestamp: Date.now(),
      binBase64: uint8ToBase64(editedBin),
    };
    const updated: Project = {
      ...currentProject,
      versions: [...currentProject.versions, newVer],
      activeVersionIdx: currentProject.versions.length,
    };
    setCurrentProject(updated);
    setSavedProjects(prev => prev.map(p => p.name === updated.name ? updated : p));
  }, [editedBin, currentProject]);

  const loadVersion = useCallback((idx: number) => {
    if (!currentProject || idx < 0 || idx >= currentProject.versions.length) return;
    const ver = currentProject.versions[idx];
    const u8 = base64ToUint8(ver.binBase64);
    setOriginalBin(u8);
    setEditedBin(new Uint8Array(u8));
    setUndoStack([]);
    setRedoStack([]);
    const updated = { ...currentProject, activeVersionIdx: idx };
    setCurrentProject(updated);
    setSavedProjects(prev => prev.map(p => p.name === updated.name ? updated : p));
  }, [currentProject]);

  const getAllProjectNames = useCallback(() => {
    return savedProjects.map(p => p.name);
  }, [savedProjects]);

  return (
    <EditorContext.Provider
      value={{
        isLoading,
        mapsDict,
        rootFolder,
        originalBin,
        editedBin,
        selectedMap,
        openTabs,
        activeTabId,
        hexViewerOffset,
        compareBin,
        undoCount: undoStack.length,
        redoCount: redoStack.length,
        linkedGroups,
        currentProject,
        savedProjects,
        loadData,
        loadDemoMode,
        setSelectedMap,
        openMapTab,
        closeMapTab,
        updateBinData,
        updateBinDataBatch,
        setHexViewOffset: setHexViewerOffset,
        toggleFolder,
        renameMap,
        renameFolder,
        exportBin,
        generateScript,
        loadCustomBin,
        loadCompareBin,
        undoAll,
        closeAllTabs,
        undo,
        redo,
        linkMaps,
        unlinkMaps,
        getLinkedGroup,
        saveProject,
        loadProject,
        deleteProject,
        saveVersion,
        loadVersion,
        getAllProjectNames,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useEditor = () => {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be within EditorProvider");
  return ctx;
};

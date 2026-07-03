'use client';

import { useEffect, useState, useRef } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { filesService } from '@/services';
import type { FileRecord } from '@/types';

// Offline library imports
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import * as XLSX from 'xlsx';
import { renderAsync } from 'docx-preview';

interface FilePreviewModalProps {
  file: FileRecord | null;
  onClose: () => void;
}

function getPreviewType(filename: string): 'image' | 'pdf' | 'text' | 'csv' | 'docx' | 'cad3d' | 'binary' {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff', 'hdr'].includes(ext)) {
    return 'image';
  }
  if (ext === 'pdf') {
    return 'pdf';
  }
  if (['txt', 'nc', 'tap', 'apt', 'sldxml', 'smgxml', 'sldreg', 'sldmat', 'sldprp', 'sldsetdoc', 'sldcfg'].includes(ext)) {
    return 'text';
  }
  if (['csv', 'xlsx'].includes(ext)) {
    return 'csv';
  }
  if (ext === 'docx') {
    return 'docx';
  }
  if (['stl', 'obj', 'ply'].includes(ext)) {
    return 'cad3d';
  }
  return 'binary';
}

function ThreeViewer({ blob, filename }: { blob: Blob | null; filename: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [materialType, setMaterialType] = useState<'original' | 'steel' | 'gold' | 'chrome' | 'bronze'>('original');
  const [renderMode, setRenderMode] = useState<'shaded' | 'wireframe' | 'both'>('shaded');
  const [autoRotate, setAutoRotate] = useState(false);
  
  const activeModelRef = useRef<THREE.Object3D | null>(null);
  const wireframeModelRef = useRef<THREE.Object3D | null>(null);
  const materialsRef = useRef<Record<string, THREE.MeshStandardMaterial>>({});
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!containerRef.current || !blob) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 15);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controlsRef.current = controls;

    // Grid & helpers
    const grid = new THREE.GridHelper(30, 30, 0x475569, 0x334155);
    grid.position.y = -2;
    scene.add(grid);

    // Lights configuration
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(10, 20, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight2.position.set(-10, -20, -10);
    scene.add(dirLight2);

    // Dynamic camera flashlight
    const camLight = new THREE.PointLight(0xffffff, 0.7, 100);
    camera.add(camLight);
    scene.add(camera);

    // Initialize materials overrides
    materialsRef.current = {
      original: null as any,
      steel: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.18, metalness: 0.85 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.15, metalness: 0.9 }),
      chrome: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.08, metalness: 0.95 }),
      bronze: new THREE.MeshStandardMaterial({ color: 0xb5a642, roughness: 0.25, metalness: 0.8 })
    };

    // Create dynamic object URL for loading
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const objectUrl = URL.createObjectURL(blob);

    let loader: STLLoader | OBJLoader | PLYLoader | null = null;
    if (ext === 'stl') loader = new STLLoader();
    else if (ext === 'obj') loader = new OBJLoader();
    else if (ext === 'ply') loader = new PLYLoader();

    if (!loader) {
      setError(true);
      setLoading(false);
      URL.revokeObjectURL(objectUrl);
      return;
    }

    let active = true;

    loader.load(
      objectUrl,
      (loadedData) => {
        if (!active) return;

        let model: THREE.Object3D;
        let hasVertexColors = false;

        if (ext === 'obj') {
          model = loadedData as THREE.Group;
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              // Back up loaded material parameters
              mesh.userData.originalMaterial = Array.isArray(mesh.material)
                ? mesh.material.map(m => m.clone())
                : mesh.material.clone();
            }
          });
        } else {
          const geom = loadedData as THREE.BufferGeometry;
          // Align geometry vertices around local (0, 0, 0)
          geom.center();
          geom.computeVertexNormals();

          if (geom.attributes.color) {
            hasVertexColors = true;
          }

          // Use a clean slate-gray CAD color for STL/PLY original rendering if no vertex color is saved
          const defaultMat = hasVertexColors
            ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.1 })
            : new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.45, metalness: 0.15 });

          const mesh = new THREE.Mesh(geom, defaultMat);
          mesh.userData.originalMaterial = defaultMat;

          model = new THREE.Group();
          model.add(mesh);
        }

        activeModelRef.current = model;
        mainGroup.add(model);

        // Center & Scale Model Camera Setup
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 5.5 / maxDim;
        model.scale.set(scale, scale, scale);

        // Shift model position so it's centered in the viewport
        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = new THREE.Vector3();
        scaledBox.getCenter(scaledCenter);
        model.position.sub(scaledCenter);

        // Position camera dynamically based on model bounding radius
        const fovRad = (camera.fov * Math.PI) / 180;
        let cameraDistance = Math.abs(5.5 / Math.sin(fovRad / 2));
        cameraDistance *= 1.25; // Add padding to fit nicely
        
        camera.position.set(cameraDistance * 0.7, cameraDistance * 0.5, cameraDistance * 0.9);
        controls.target.set(0, 0, 0);
        controls.maxDistance = cameraDistance * 5;
        controls.update();

        // Create wireframe model clone
        const wireframe = model.clone();
        wireframe.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
            (child as THREE.Mesh).visible = false;
          }
        });
        wireframeModelRef.current = wireframe;
        scene.add(wireframe);

        setLoading(false);
        URL.revokeObjectURL(objectUrl);
      },
      undefined,
      (err) => {
        console.error('Error loading mesh:', err);
        if (active) {
          setError(true);
          setLoading(false);
          URL.revokeObjectURL(objectUrl);
        }
      }
    );

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      active = false;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      controls.dispose();
      renderer.dispose();
      controlsRef.current = null;
    };
  }, [blob, filename]);

  useEffect(() => {
    const model = activeModelRef.current;
    if (!model) return;

    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (materialType === 'original') {
          if (mesh.userData.originalMaterial) {
            mesh.material = mesh.userData.originalMaterial;
          }
        } else {
          const mat = materialsRef.current[materialType];
          if (mat) mesh.material = mat;
        }
      }
    });
  }, [materialType]);

  useEffect(() => {
    const solidModel = activeModelRef.current;
    const wireModel = wireframeModelRef.current;
    if (!solidModel || !wireModel) return;

    solidModel.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).visible = (renderMode === 'shaded' || renderMode === 'both');
      }
    });

    wireModel.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).visible = (renderMode === 'wireframe' || renderMode === 'both');
      }
    });
  }, [renderMode]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [autoRotate]);

  const rotateModel = (axis: 'x' | 'y' | 'z') => {
    const model = activeModelRef.current;
    const wireModel = wireframeModelRef.current;
    if (model) {
      if (axis === 'x') model.rotation.x += Math.PI / 2;
      if (axis === 'y') model.rotation.y += Math.PI / 2;
      if (axis === 'z') model.rotation.z += Math.PI / 2;
    }
    if (wireModel) {
      if (axis === 'x') wireModel.rotation.x += Math.PI / 2;
      if (axis === 'y') wireModel.rotation.y += Math.PI / 2;
      if (axis === 'z') wireModel.rotation.z += Math.PI / 2;
    }
  };

  const resetOrientation = () => {
    const model = activeModelRef.current;
    const wireModel = wireframeModelRef.current;
    if (model) {
      model.rotation.set(0, 0, 0);
    }
    if (wireModel) {
      wireModel.rotation.set(0, 0, 0);
    }
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-[70vh] rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-red-500 bg-slate-900 z-50">
          Error Loading 3D Mesh Geometry
        </div>
      )}

      <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-slate-200 text-xs z-40 max-w-[180px] space-y-2.5">
        <div>
          <span className="block font-semibold text-slate-400 mb-1">CAD Material</span>
          <select
            value={materialType}
            onChange={(e) => setMaterialType(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
          >
            <option value="original">Original / Loaded</option>
            <option value="steel">Polished Steel</option>
            <option value="gold">Gold</option>
            <option value="chrome">Chrome</option>
            <option value="bronze">Bronze</option>
          </select>
        </div>
        
        <div>
          <span className="block font-semibold text-slate-400 mb-1">Render Mode</span>
          <select
            value={renderMode}
            onChange={(e) => setRenderMode(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
          >
            <option value="shaded">Solid Shaded</option>
            <option value="wireframe">Wireframe Only</option>
            <option value="both">Shaded + Wireframe</option>
          </select>
        </div>

        <div className="pt-1.5 border-t border-slate-800 space-y-2">
          <span className="block font-semibold text-slate-400">Interaction</span>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`w-full text-left px-2.5 py-1.5 rounded border text-[11px] font-medium transition-colors flex items-center justify-between ${
              autoRotate 
                ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span>Auto Rotate View</span>
            <span className={`h-2 w-2 rounded-full ${autoRotate ? 'bg-blue-400 animate-pulse' : 'bg-slate-500'}`} />
          </button>

          <span className="block font-semibold text-slate-400 pt-1 text-[10px] uppercase">Rotate Model (+90°)</span>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => rotateModel('x')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 py-1 rounded font-bold"
            >
              X
            </button>
            <button
              onClick={() => rotateModel('y')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 py-1 rounded font-bold"
            >
              Y
            </button>
            <button
              onClick={() => rotateModel('z')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 py-1 rounded font-bold"
            >
              Z
            </button>
          </div>

          <button
            onClick={resetOrientation}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-400 py-1 rounded transition-colors mt-1"
          >
            Reset View
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

function SheetViewer({ blob, filename }: { blob: Blob | null; filename: string }) {
  const [data, setData] = useState<unknown[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!blob) return;
    const isXlsx = filename.toLowerCase().endsWith('.xlsx');

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const rawData = e.target?.result;
        if (!rawData) throw new Error('No data read');

        let workbook;
        if (isXlsx) {
          workbook = XLSX.read(rawData, { type: 'array' });
        } else {
          workbook = XLSX.read(rawData as string, { type: 'string' });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][];
        setData(json);
      } catch (err) {
        console.error('Error parsing sheet:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fileReader.onerror = () => {
      setError(true);
      setLoading(false);
    };

    if (isXlsx) {
      fileReader.readAsArrayBuffer(blob);
    } else {
      fileReader.readAsText(blob);
    }
  }, [blob, filename]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-red-500">
        Unable to parse spreadsheet. Use download to view local copy.
      </div>
    );
  }

  const headers = (data[0] || []) as string[];
  const rows = data.slice(1) as string[][];

  return (
    <div className="overflow-auto max-h-[70vh] border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
      <table className="min-w-full border-collapse text-left text-xs text-gray-500 dark:text-gray-400">
        <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky top-0 border-b border-gray-200 dark:border-gray-700">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                {String(h).trim() || `Col ${i + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-150 dark:divide-gray-855 bg-white dark:bg-gray-900 font-mono text-[11px]">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-955/20'}>
              {headers.map((_, cIdx) => (
                <td key={cIdx} className="px-4 py-2 border-r border-gray-200 dark:border-gray-800 last:border-r-0 text-gray-700 dark:text-gray-300">
                  {String(row[cIdx] !== undefined ? row[cIdx] : '').trim()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocxViewer({ blob }: { blob: Blob | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!blob || !containerRef.current) return;

    let active = true;
    setLoading(true);
    setError(false);

    renderAsync(blob, containerRef.current)
      .then(() => {
        if (active) setLoading(false);
      })
      .catch((err: any) => {
        console.error('Error rendering docx:', err);
        if (active) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [blob]);

  return (
    <div className="relative overflow-auto max-h-[70vh] border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-955 p-4 min-h-[50vh]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-955/80 z-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-red-500 bg-white dark:bg-gray-955 z-50">
          Unable to preview Word document. Please download to view locally.
        </div>
      )}

      <div ref={containerRef} className="docx-viewer-content bg-white text-black p-5 rounded min-h-full" />
    </div>
  );
}

function TextCodeViewer({ previewUrl }: { previewUrl: string }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(previewUrl)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [previewUrl]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const lines = content.split('\n');

  return (
    <div className="overflow-auto max-h-[70vh] border border-gray-255 dark:border-gray-800 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs p-4 flex">
      <div className="text-right text-slate-500 select-none pr-3 border-r border-slate-800 text-[11px] min-w-8">
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <pre className="pl-3 overflow-x-auto text-[11px] leading-normal flex-1">
        {lines.map((line, i) => (
          <div key={i}>{line || ' '}</div>
        ))}
      </pre>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function BinaryCardViewer({ file }: { file: FileRecord }) {
  const ext = file.originalName.split('.').pop()?.toUpperCase() ?? '';
  
  let formatDesc = 'Secure CAD binary asset.';
  if (ext === 'CWR') formatDesc = 'SOLIDWORKS Simulation Study Results document.';
  if (ext === 'SVPJ') formatDesc = 'SOLIDWORKS Visualize Rendering Project file.';
  if (ext === 'SVLSLP') formatDesc = 'SOLIDWORKS Visualize Scene Template.';
  if (ext === 'SMG') formatDesc = 'SOLIDWORKS Composer 3D Interactive Authoring document.';
  if (ext === 'EXE') formatDesc = 'Composer Self-Executable 3D Document.';
  if (ext === 'IXPRJ') formatDesc = 'SOLIDWORKS Inspection Project document.';
  if (ext === 'SLDMAT') formatDesc = 'SOLIDWORKS Materials Database File.';
  if (ext === 'SLDLIB') formatDesc = 'SOLIDWORKS Design Library Database.';
  if (ext === 'SLDPRT') formatDesc = 'SOLIDWORKS 3D Part Model.';
  if (ext === 'SLDASM') formatDesc = 'SOLIDWORKS Assembly Model.';
  if (ext === 'SLDDRW') formatDesc = 'SOLIDWORKS 2D Drawing Blueprint.';
  if (ext === 'STEP' || ext === 'STP') formatDesc = 'Standard exchange STEP 3D CAD document.';
  if (ext === 'IGES' || ext === 'IGS') formatDesc = 'Standard exchange IGES CAD document.';
  if (ext === 'X_T' || ext === 'X_B') formatDesc = 'Parasolid CAD binary file.';

  return (
    <div className="flex h-full min-h-[40vh] items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col items-center max-w-md text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-md">
        <div className="h-16 w-16 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 flex items-center justify-center mb-4">
          <span className="font-bold text-lg">{ext}</span>
        </div>
        <h4 className="text-md font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-wider">{file.originalName}</h4>
        <p className="text-xs text-gray-400 font-mono mb-4">{file.checksum || 'SECURE_BINARY_METADATA_LOCKED'}</p>
        
        <div className="w-full text-left space-y-2 border-t border-b border-slate-100 dark:bg-slate-850 py-4 my-4 text-xs">
          <div className="flex justify-between"><span className="text-gray-400">File Type</span><span className="font-semibold text-gray-700 dark:text-gray-300">{ext} File</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Category</span><span className="font-semibold text-gray-700 dark:text-gray-300">{formatDesc}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="font-semibold text-green-600 font-bold">Secure Vault Certified</span></div>
        </div>
        
        <p className="text-xs text-gray-500 italic">This proprietary SOLIDWORKS/CAD binary format is stored securely. Local web preview is disabled for this file type to protect drawing/model integrity. Please download the file to view it in native CAD software.</p>
      </div>
    </div>
  );
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setPreviewBlob(null);
      setError(false);
      setShowVerification(false);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(false);
    setShowVerification(false);

    filesService
      .preview(file.id)
      .then((blob) => {
        if (!active) return;
        setPreviewBlob(blob);
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
      }
    };

    if (file) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file]);

  if (!file) return null;

  const previewType = getPreviewType(file.originalName);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{file.originalName}</h3>
            <p className="text-sm text-gray-500">
              {file.description?.trim() ? file.description : 'No details provided.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded bg-blue-600 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase sm:inline">
              Secure local preview (download / print disabled)
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 p-4 dark:bg-gray-955 relative">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="flex h-full items-center justify-center text-sm text-red-500">
              Unable to load preview.
            </div>
          )}

          {previewUrl && !loading && (
            <div className="h-full w-full relative font-sans">
              {previewType === 'image' && (
                <div 
                  className="flex h-full items-center justify-center bg-white dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-800 overflow-auto"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <img src={previewUrl} alt={file.originalName} className="max-h-[70vh] object-contain rounded" />
                </div>
              )}

              {previewType === 'pdf' && (
                <iframe
                  src={`${previewUrl}#toolbar=0`}
                  title={file.originalName}
                  className="h-full min-h-[70vh] w-full rounded-lg border border-gray-200 bg-white"
                  onContextMenu={(e) => e.preventDefault()}
                />
              )}

              {previewType === 'text' && (
                <TextCodeViewer previewUrl={previewUrl} />
              )}

              {previewType === 'csv' && (
                <SheetViewer blob={previewBlob} filename={file.originalName} />
              )}

              {previewType === 'docx' && (
                <DocxViewer blob={previewBlob} />
              )}

              {previewType === 'cad3d' && (
                <ThreeViewer blob={previewBlob} filename={file.originalName} />
              )}

              {previewType === 'binary' && (
                <BinaryCardViewer file={file} />
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
// @ts-ignore
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useReadContract } from 'wagmi';
import { CheckCircle, XCircle, AlertCircle, ScanLine, Filter } from 'lucide-react';
import CivicRegistryABI from '@/abis/CivicGuardRegistry.json'; 

// 1. DEFINE AVAILABLE ROLES (The Checklist Options)
const POSSIBLE_ROLES = ["DOCTOR", "DRIVER", "ENGINEER", "PARAMEDIC", "ADMIN"];

export default function VerifierPage() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [verificationStatus, setStatus] = useState<'idle' | 'success' | 'failed' | 'denied'>('idle');
  
  // 2. STATE FOR THE CHECKLIST (What Karan wants)
  const [requiredRoles, setRequiredRoles] = useState<string[]>([]);

  // 3. TOGGLE CHECKBOX FUNCTION
  const toggleRole = (role: string) => {
    setRequiredRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  // 4. BLOCKCHAIN FETCH
  const { data: userRoles } = useReadContract({
    address: '0xYOUR_CONTRACT_ADDRESS_HERE', 
    abi: CivicRegistryABI,
    functionName: 'getRoles',
    args: scanResult ? [scanResult.publicSignals[0]] : undefined,
    query: { enabled: !!scanResult }
  });

  // 5. THE "MATCHING" LOGIC (Run this when data arrives)
  useEffect(() => {
    if (userRoles && Array.isArray(userRoles)) {
      // If Karan hasn't selected anything, we verify everyone (General Mode)
      if (requiredRoles.length === 0) {
        setStatus('success'); 
        return;
      }

      // Check if User has AT LEAST ONE of the required roles
      const hasPermission = requiredRoles.some(req => userRoles.includes(req));
      
      if (hasPermission) {
        setStatus('success');
      } else {
        setStatus('denied'); // New Status: "Denied"
      }
    }
  }, [userRoles, requiredRoles]);


  // ... (Scanner Logic matches previous code) ...
  useEffect(() => {
    if (verificationStatus === 'idle') {
      // @ts-ignore
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render(onScanSuccess, (err: any) => console.log(err));
      function onScanSuccess(decodedText: string) {
        try {
          const data = JSON.parse(decodedText);
          scanner.clear();
          verifyProof(data);
        } catch (e) { console.error("Invalid QR", e); }
      }
      return () => { try { scanner.clear(); } catch(e) {} };
    }
  }, [verificationStatus]);

  const verifyProof = async (data: any) => {
    try {
      // @ts-ignore
      const snarkjs = await import('snarkjs');
      const isValid = await snarkjs.groth16.verify("/zk/verification_key.json", data.publicSignals, data.proof);
      if (isValid) setScanResult(data); // Triggers Blockchain Fetch
      else setStatus('failed');
    } catch (e) { setStatus('failed'); }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4 text-blue-400">Verifier Command</h1>

      {/* --- THE CHECKLIST UI (Karan's Filter) --- */}
      {verificationStatus === 'idle' && (
        <div className="w-full max-w-md mb-6 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-3 text-slate-300">
             <Filter className="w-4 h-4" /> 
             <span className="text-sm font-bold uppercase">Required Roles (Filter)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {POSSIBLE_ROLES.map(role => (
              <button
                key={role}
                onClick={() => toggleRole(role)}
                className={`px-3 py-1 text-sm rounded-full border transition-all ${
                  requiredRoles.includes(role) 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {role} {requiredRoles.includes(role) && "✓"}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {requiredRoles.length === 0 ? "(Verifying Everyone)" : `Scanning only for: ${requiredRoles.join(", ")}`}
          </p>
        </div>
      )}

      {/* --- SCANNER --- */}
      {verificationStatus === 'idle' && (
        <div className="w-full max-w-md bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div id="reader" className="overflow-hidden rounded-lg"></div>
        </div>
      )}

      {/* --- RESULT: SUCCESS --- */}
      {verificationStatus === 'success' && (
        <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl border border-green-500/50 text-center animate-in zoom-in">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Entry Granted</h2>
          <p className="text-slate-400">Role Match Confirmed</p>
          
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {userRoles && (userRoles as string[]).map(role => (
              <span key={role} className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm border border-slate-700">
                {role}
              </span>
            ))}
          </div>

          <button onClick={() => { setStatus('idle'); setScanResult(null); }} className="mt-8 w-full py-3 bg-blue-600 rounded-lg font-bold">
            Next Volunteer
          </button>
        </div>
      )}

      {/* --- RESULT: DENIED (Wrong Role) --- */}
      {verificationStatus === 'denied' && (
        <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl border border-orange-500/50 text-center animate-in zoom-in">
          <AlertCircle className="w-20 h-20 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-orange-500">Access Denied</h2>
          <p className="text-slate-300 mt-2">Volunteer does not have required role.</p>
          
          <div className="bg-slate-800 p-4 rounded-lg mt-4 text-left text-sm">
             <p className="text-slate-500">Required: <span className="text-white">{requiredRoles.join(", ")}</span></p>
             <p className="text-slate-500 mt-1">Found: <span className="text-red-400">
                {userRoles && (userRoles as string[]).join(", ")}
             </span></p>
          </div>

          <button onClick={() => { setStatus('idle'); setScanResult(null); }} className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">
            Try Again
          </button>
        </div>
      )}

      {/* --- RESULT: FAILED (Bad Math) --- */}
      {verificationStatus === 'failed' && (
        <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl text-center">
           <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
           <h2 className="text-xl font-bold text-red-500">Fake Identity</h2>
           <button onClick={() => setStatus('idle')} className="mt-6 w-full py-3 bg-slate-800 rounded-lg">Retry</button>
        </div>
      )}
    </main>
  );
}
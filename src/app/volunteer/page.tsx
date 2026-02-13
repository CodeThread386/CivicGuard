'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { 
  ShieldCheck, 
  Fingerprint, 
  Lock, 
  Wallet, 
  Loader2, 
  LogOut, 
  Copy, 
  Check, 
  ShieldAlert,
  CreditCard,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import { createWallet, WalletData, walletFromPrivateKey } from '@/lib/wallet';
import { WebAuthnService } from '@/lib/webauthn';
import { generateProof } from '@/lib/zkProver';
import { 
  isLocked, 
  storeEncryptedKeys, 
  getEncryptedKeys, 
  clearKeys, 
  deriveKeyFromPassword,
  encryptWithKey,
  decryptWithKey,
  lock
} from '@/lib/keyStorage';

type WalletStatus = 'loading' | 'no-wallet' | 'locked' | 'unlocked';

export default function VolunteerPage() {
  const router = useRouter();
  const [status, setStatus] = useState<WalletStatus>('loading');
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null); // Securely hold key in memory
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrValue, setQrValue] = useState<string | null>(null);

  // Check initial state on mount
  useEffect(() => {
    checkWalletState();
  }, []);

  const checkWalletState = async () => {
    try {
      // Check if we have encrypted keys stored
      const hasKeys = await getEncryptedKeys('volunteer_1'); // Using a fixed ID for this demo
      
      if (!hasKeys) {
        setStatus('no-wallet');
        return;
      }

      // Check if wallet is currently locked
      const locked = await isLocked();
      if (locked) {
        setStatus('locked');
      } else {
        // In a real app, we might check if we still have the key in memory context
        // For security, reload usually means locked, so default to locked if not explicitly open
        setStatus('locked'); 
      }
    } catch (err) {
      console.error('Failed to check wallet state:', err);
      setError('Failed to load wallet state');
    }
  };

  const handleCreateWallet = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      // 1. Create Ethereum Wallet
      const { wallet: newWallet, privateKey: newPrivateKey } = createWallet();

      // 2. Register WebAuthn to get a credential ID (which we'll use as the "password")
      // We use a fixed user ID for this hackathon demo
      const credential = await WebAuthnService.register('volunteer_1', 'Volunteer');
      
      if (!credential) {
        throw new Error('Biometric registration failed');
      }

      // 3. Derive key from credential ID
      // We use the credential ID as the high-entropy input for key derivation
      // In production, you'd also want to store the credential ID safely to look it up later
      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKeyFromPassword(credential.id, salt);

      // 4. Encrypt private key
      const encrypted = await encryptWithKey(key, newPrivateKey);
      
      // 5. Store encrypted bundle
      const storageData = JSON.stringify({
        ...encrypted,
        salt: Array.from(salt), // Store salt to re-derive key
        walletData: newWallet // Store public wallet data unencrypted (or encrypted if you prefer)
      });
      
      await storeEncryptedKeys(storageData, 'volunteer_1');

      setWallet(newWallet);
      setPrivateKey(newPrivateKey);
      setStatus('unlocked');
    } catch (err) {
      console.error('Wallet creation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlock = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      // 1. Authenticate with WebAuthn
      const credential = await WebAuthnService.authenticate('Unlock your wallet');
      
      if (!credential) {
        throw new Error('Biometric authentication failed');
      }

      // 2. Retrieve encrypted bundle
      const storedData = await getEncryptedKeys('volunteer_1');
      if (!storedData) {
        throw new Error('No wallet found');
      }

      const { ciphertext, iv, salt, walletData } = JSON.parse(storedData);

      // 3. Derive key using the credential ID and stored salt
      const key = await deriveKeyFromPassword(credential.id, new Uint8Array(salt));

      // 4. Decrypt private key
      const decryptedPrivateKey = await decryptWithKey(key, ciphertext, iv);
      
      // 5. Reconstruct wallet object
      // Verify it matches stored public data
      const unlockedWallet = walletFromPrivateKey(decryptedPrivateKey);
      
      if (unlockedWallet.address !== walletData.address) {
        throw new Error('Security check failed: Wallet address mismatch');
      }

      setWallet(unlockedWallet);
      setPrivateKey(decryptedPrivateKey); // Store key for ZK usage
      setStatus('unlocked');
    } catch (err) {
      console.error('Unlock failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to unlock wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLock = async () => {
    await lock();
    setWallet(null);
    setPrivateKey(null);
    setQrValue(null);
    setStatus('locked');
  };

  const handleGenerateProof = async () => {
    if (!privateKey) {
      setError("Wallet locked or private key missing");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const { proof, publicSignals } = await generateProof(privateKey);
      setQrValue(JSON.stringify({ proof, publicSignals }));
    } catch (err) {
      console.error('ZK Proof generation failed:', err);
      setError("Failed to generate Zero-Knowledge proof");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      <div className="bg-gradient-to-b from-blue-900/20 to-transparent pb-12 pt-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold tracking-tight">CivicGuard</span>
            </div>
            {status === 'unlocked' && (
              <button 
                onClick={handleLock}
                className="flex items-center gap-2 rounded-full bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur transition hover:bg-slate-800 hover:text-white"
              >
                <Lock className="h-4 w-4" />
                Lock Wallet
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-lg px-4 -mt-8">
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
          {/* Background decoration */ }
          <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none"></div>

          {/* Error Message */ }
          {error && (
            <div className="absolute top-4 left-4 right-4 z-10 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200 backdrop-blur-md">
                <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
                <p>{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200">×</button>
              </div>
            </div>
          )}

          <div className="relative z-0 p-8">
            
            {/* Status: No Wallet */ }
            {status === 'no-wallet' && (
              <div className="flex flex-col items-center text-center py-8">
                <div className="mb-6 rounded-full bg-blue-500/10 p-6 ring-1 ring-blue-500/20">
                  <Wallet className="h-12 w-12 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Create Your Digital Wallet</h2>
                <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                  Your identity and credentials will be secured in this encrypted wallet.
                </p>
                
                <div className="w-full space-y-4">
                  <button
                    onClick={handleCreateWallet}
                    disabled={isProcessing}
                    className="group relative w-full overflow-hidden rounded-xl bg-blue-600 p-4 font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center gap-2">
                       {isProcessing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Fingerprint className="h-5 w-5" />
                      )}
                      <span>
                        {isProcessing ? 'Securing Wallet...' : 'Create with Biometrics'}
                      </span>
                    </div>
                  </button>
                  <p className="text-xs text-slate-500 text-center">
                    Secured by device hardware security module
                  </p>
                </div>
              </div>
            )}

            {/* Status: Locked */ }
            {status === 'locked' && (
              <div className="flex flex-col items-center text-center py-8">
                 <div className="mb-6 rounded-full bg-slate-800 p-6 ring-1 ring-slate-700">
                  <Lock className="h-12 w-12 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Wallet Locked</h2>
                <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                  Authenticate to access your volunteer credentials.
                </p>

                <button
                  onClick={handleUnlock}
                  disabled={isProcessing}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-4 font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98] disabled:opacity-70"
                >
                  <div className="flex items-center justify-center gap-2">
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                       <Fingerprint className="h-5 w-5" />
                    )}
                    <span>Unlock Wallet</span>
                  </div>
                </button>
              </div>
            )}

            {/* Status: Unlocked */ }
            {status === 'unlocked' && wallet && (
               <div className="py-4 space-y-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px]">
                    <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center">
                       <span className="text-2xl font-bold">JD</span>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-white">Welcome Back</h2>
                  <p className="text-sm text-slate-400">Volunteer</p>
                </div>

                <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Wallet Address</span>
                    <CreditCard className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 border border-slate-800 group">
                    <code className="text-sm text-blue-300 truncate mr-4 font-mono">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </code>
                    <button 
                      onClick={handleCopyAddress}
                      className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-4 border border-blue-500/20 flex flex-col items-center justify-center gap-2 text-center hover:bg-blue-500/20 transition cursor-pointer">
                    <div className="p-2 rounded-full bg-blue-500/20">
                      <ShieldCheck className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-blue-100">My Credentials</span>
                  </div>
                   <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50 flex flex-col items-center justify-center gap-2 text-center hover:bg-slate-800 transition cursor-pointer opacity-50">
                    <div className="p-2 rounded-full bg-slate-700">
                      <LogOut className="h-6 w-6 text-slate-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-400">Coming Soon</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={handleGenerateProof}
                    disabled={isProcessing}
                    className="w-full rounded-xl bg-purple-600 p-4 font-semibold text-white transition hover:bg-purple-500 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <QrCode className="h-5 w-5" />
                    )}
                    <span>Generate Verification QR</span>
                  </button>
                  
                  {qrValue && (
                    <div className="mt-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
                      <div className="p-4 bg-white rounded-xl shadow-lg">
                        <QRCodeSVG value={qrValue} size={256} />
                      </div>
                      <p className="mt-4 text-sm text-slate-400 text-center max-w-xs">
                        Scan this QR code to verify your identity without revealing your private key.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer info */ }
        <div className="mt-8 text-center px-4">
           <p className="text-xs text-slate-600 max-w-sm mx-auto">
             CivicGuard protects your identity using Zero-Knowledge Proofs. Your private keys never leave your device.
           </p>
        </div>
      </main>
    </div>
  );
}

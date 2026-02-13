/**
 * WebAuthn service for biometric authentication (fingerprint/Face ID)
 * Used to unlock/protect private keys - keys never leave secure enclave until user authenticates
 */

export class WebAuthnService {
  private static readonly RP_ID =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  private static readonly RP_NAME = "CivicGuard";

  static isAvailable(): boolean {
    return (
      typeof window !== "undefined" && window.PublicKeyCredential !== undefined
    );
  }

  static async register(
    userId: string,
    userName: string,
  ): Promise<Credential | null> {
    if (!this.isAvailable()) return null;

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: this.RP_NAME,
          id:
            this.RP_ID === "localhost"
              ? "localhost"
              : this.RP_ID.split(".").slice(-2).join("."),
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          requireResidentKey: false,
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      });

      return credential as PublicKeyCredential;
    } catch (err) {
      console.error("WebAuthn register error:", err);
      return null;
    }
  }

  static async authenticate(
    reason: string,
  ): Promise<PublicKeyCredential | null> {
    if (!this.isAvailable()) return null;

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const options: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        userVerification: "required",
        rpId:
          this.RP_ID === "localhost"
            ? "localhost"
            : this.RP_ID.split(".").slice(-2).join("."),
      };

      const credential = await navigator.credentials.get({
        publicKey: options,
        mediation: "optional",
      });

      return credential as PublicKeyCredential;
    } catch (err) {
      console.error("WebAuthn authenticate error:", err);
      return null;
    }
  }

  static getFriendlyName(): string {
    if (typeof navigator === "undefined") return "Biometric";
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return "Face ID or Touch ID";
    if (/Android/.test(ua)) return "Fingerprint";
    return "Security key or biometric";
  }
}

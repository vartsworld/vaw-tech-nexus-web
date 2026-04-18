import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, Trash2, Shield, AlertTriangle } from "lucide-react";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { toast } from "sonner";

interface BiometricSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BiometricSettingsDialog = ({ open, onOpenChange }: BiometricSettingsDialogProps) => {
  const { isSupported, isRegistering, credentials, loadCredentials, register, removeCredential } = useBiometricAuth();

  useEffect(() => {
    if (open) loadCredentials();
  }, [open, loadCredentials]);

  const handleRegister = async () => {
    const success = await register();
    if (success) {
      toast.success("Fingerprint registered on this device!");
    } else {
      toast.error("Could not register fingerprint. Please try again.");
    }
  };

  const handleRemove = async (id: string) => {
    const success = await removeCredential(id);
    toast[success ? "success" : "error"](
      success ? "Device removed" : "Failed to remove device"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Biometric Login
          </DialogTitle>
          <DialogDescription>
            Use your fingerprint or face to log in instantly on this device.
          </DialogDescription>
        </DialogHeader>

        {!isSupported ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">Not supported on this device</p>
              <p className="text-amber-700 mt-1">
                Biometric login requires a device with fingerprint or face recognition (e.g. modern phones, MacBooks with Touch ID, or Windows Hello).
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Registered devices list */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Registered devices</h4>
              {credentials.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No devices registered yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {credentials.map((cred) => (
                    <div
                      key={cred.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <Fingerprint className="h-4 w-4 text-green-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            {cred.device_name || "Unknown device"}
                          </p>
                          <p className="text-xs text-green-700">
                            Added {new Date(cred.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(cred.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Register new */}
            <Button
              onClick={handleRegister}
              disabled={isRegistering}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Fingerprint className="h-5 w-5 mr-2" />
              {isRegistering ? "Registering…" : "Register this device"}
            </Button>

            <div className="text-xs text-gray-500 space-y-1 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p>💡 <strong>Tip:</strong> You can register multiple devices (e.g. your phone and your laptop).</p>
              <p>🔒 Your biometric data never leaves your device — only a public key is stored on our servers.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BiometricSettingsDialog;

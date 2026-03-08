import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Phone } from "lucide-react";
import { useState } from "react";

export default function EmergencyCallButton() {
  const [open, setOpen] = useState(false);

  const handleCall = () => {
    window.location.href = "tel:911";
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 bg-sonic-red text-white font-fredoka text-sm px-3 py-2 rounded-full
                     hover:opacity-90 active:scale-95 transition-all duration-150 shadow-md animate-pulse"
          aria-label="Emergency Call 911"
        >
          <Phone size={14} />
          <span>SOS</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-fredoka text-2xl text-destructive flex items-center gap-2">
            <Phone size={24} /> Emergency Call
          </AlertDialogTitle>
          <AlertDialogDescription className="font-nunito text-base">
            Are you sure you want to call{" "}
            <strong>emergency services (911)</strong>? Only use this in a real
            emergency.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full font-nunito font-700">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCall}
            className="rounded-full font-fredoka text-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Phone size={16} className="mr-1" /> Call 911
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

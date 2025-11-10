"use client";

import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Type, Eraser, Check } from "lucide-react";
import { toast } from "sonner";

type Props = {
  proposalId: string;
  onSignatureComplete?: () => void;
};

export function SignatureComponent({ proposalId, onSignatureComplete }: Props) {
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [signerInfo, setSignerInfo] = useState({
    name: "",
    email: "",
    title: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
    setTypedName("");
  };

  const generateTypedSignature = () => {
    if (!typedName.trim()) return null;

    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Signature text
      ctx.fillStyle = "#000000";
      ctx.font = "italic 48px 'Brush Script MT', cursive, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

      // Return base64
      return canvas.toDataURL("image/png");
    }
    return null;
  };

  const handleSaveSignature = async () => {
    // Validate signer info
    if (!signerInfo.name || !signerInfo.email) {
      toast.error("Please fill in your name and email");
      return;
    }

    // Get signature data
    let signatureBlob: string | null = null;

    if (signatureMode === "draw") {
      if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
        toast.error("Please draw your signature");
        return;
      }
      signatureBlob = signaturePadRef.current.toDataURL("image/png");
    } else {
      if (!typedName.trim()) {
        toast.error("Please type your name");
        return;
      }
      signatureBlob = generateTypedSignature();
    }

    if (!signatureBlob) {
      toast.error("Failed to generate signature");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/proposals/${proposalId}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signerName: signerInfo.name,
          signerEmail: signerInfo.email,
          signerTitle: signerInfo.title || null,
          signatureBlob,
          signatureType: signatureMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save signature");
      }

      toast.success("Signature saved successfully");
      onSignatureComplete?.();
    } catch (error) {
      console.error("Save signature error:", error);
      toast.error("Failed to save signature");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Sign Proposal</CardTitle>
        <CardDescription>
          Please sign below to accept this proposal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Signer Information */}
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="signerName">Your Name *</Label>
              <Input
                id="signerName"
                placeholder="John Doe"
                value={signerInfo.name}
                onChange={(e) =>
                  setSignerInfo({ ...signerInfo, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signerEmail">Email Address *</Label>
              <Input
                id="signerEmail"
                type="email"
                placeholder="john@example.com"
                value={signerInfo.email}
                onChange={(e) =>
                  setSignerInfo({ ...signerInfo, email: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signerTitle">Job Title (Optional)</Label>
            <Input
              id="signerTitle"
              placeholder="e.g., CEO, Project Manager"
              value={signerInfo.title}
              onChange={(e) =>
                setSignerInfo({ ...signerInfo, title: e.target.value })
              }
            />
          </div>
        </div>

        {/* Signature Input */}
        <Tabs value={signatureMode} onValueChange={(v) => setSignatureMode(v as "draw" | "type")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw">
              <Pencil className="mr-2 h-4 w-4" />
              Draw Signature
            </TabsTrigger>
            <TabsTrigger value="type">
              <Type className="mr-2 h-4 w-4" />
              Type Signature
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-2 bg-white">
              <SignatureCanvas
                ref={signaturePadRef}
                canvasProps={{
                  className: "w-full h-40 cursor-crosshair",
                }}
                backgroundColor="#ffffff"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
              >
                <Eraser className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="typedSignature">Type Your Name</Label>
              <Input
                id="typedSignature"
                placeholder="Your full name"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="text-2xl font-serif italic"
              />
            </div>
            {typedName && (
              <div className="border-2 rounded-lg p-6 bg-white flex items-center justify-center h-40">
                <p className="text-5xl font-serif italic text-gray-700">
                  {typedName}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSaveSignature}
            disabled={isSaving}
            size="lg"
          >
            <Check className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Sign & Accept Proposal"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit2, Play, AlertCircle, Gamepad2, Calendar } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { useCompany, useCompanyCrumbs } from "../company-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

type OfferRow = {
  id: string;
  title: string;
  type: string;
  event?: string;
  isActive: boolean;
  createdAt: number;
};

const GAME_TYPES = [
  { value: "wheel", label: "🎯 Spin the Wheel" },
  { value: "scratch", label: "🎁 Scratch Card" },
  { value: "slot", label: "🎰 Slot Machine" },
  { value: "giftbox", label: "📦 Pick a Box" },
  { value: "plinko", label: "🔴 Drop the Ball" },
  { value: "memory", label: "🧠 Memory Match" },
];

const EVENT_THEMES = [
  { value: "none", label: "Default Style" },
  { value: "halloween", label: "🎃 Halloween" },
  { value: "christmas", label: "🎄 Christmas" },
  { value: "birthday", label: "🎂 Birthday" },
  { value: "anniversary", label: "✨ Anniversary" },
];

export default function OffersListPage() {
  const { company } = useCompany();
  const crumbs = useCompanyCrumbs("Offers");

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("wheel");
  const [newEvent, setNewEvent] = useState("none");
  const [creating, setCreating] = useState(false);

  async function fetchOffers() {
    try {
      const res = await fetch(`/api/admin/companies/${company.id}/offers`);
      if (!res.ok) throw new Error("Failed to load offers");
      const data = await res.json();
      setOffers(data.offers || []);
    } catch (err) {
      setError("Failed to load offers. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOffers();
  }, [company.id]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/companies/${company.id}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          type: newType,
          event: newEvent,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create offer");
      }
      setNewTitle("");
      setShowCreate(false);
      await fetchOffers();
    } catch (err: any) {
      setError(err.message || "Failed to create offer");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(offerId: string) {
    if (!confirm("Are you sure you want to delete this offer? All configuration, prizes, and spins will be lost.")) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/admin/offers/${offerId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete offer");
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
    } catch {
      setError("Failed to delete offer.");
    }
  }

  async function toggleActive(offer: OfferRow) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/offers/${offer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !offer.isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle state");
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, isActive: !o.isActive } : o))
      );
    } catch {
      setError("Failed to update status.");
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <SiteHeader crumbs={crumbs} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Offers & Games</h2>
          <p className="text-muted-foreground">
            Create and manage customer engagement games, sweepstakes, and seasonal offers.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Offer
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner className="h-6 w-6 text-muted-foreground" />
        </div>
      ) : offers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Gamepad2 className="h-12 w-12 text-muted-foreground/60 mb-4" />
          <CardTitle className="mb-2">No offers created yet</CardTitle>
          <CardDescription className="mb-4">
            Get started by creating your first interactive game or event-themed landing page.
          </CardDescription>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Offer
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => {
            const gameLabel = GAME_TYPES.find((g) => g.value === offer.type)?.label ?? offer.type;
            const eventLabel = EVENT_THEMES.find((e) => e.value === (offer.event ?? "none"))?.label ?? (offer.event ?? "Default");

            return (
              <Card key={offer.id} className="relative flex flex-col justify-between overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={offer.isActive ? "default" : "secondary"}>
                      {offer.isActive ? "Active" : "Draft"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-1">{offer.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-1.5">
                    <Gamepad2 className="h-3.5 w-3.5" /> {gameLabel}
                  </CardDescription>
                  <CardDescription className="flex items-center gap-1.5 mt-1">
                    <Calendar className="h-3.5 w-3.5" /> Theme: {eventLabel}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex gap-2 border-t bg-muted/30 pt-4">
                  <Link
                    href={`/admin/${company.slug}/offers/${offer.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm", className: "flex-1" })}
                  >
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Manage
                  </Link>
                  <Button
                    variant={offer.isActive ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleActive(offer)}
                    className="flex-1"
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5" /> {offer.isActive ? "Pause" : "Activate"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(offer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Offer Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold mb-4">Create New Offer</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="offer-title">Offer Title</Label>
                <Input
                  id="offer-title"
                  placeholder="e.g. Summer Scratch Card, Halloween Wheel"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer-type">Game Type</Label>
                <select
                  id="offer-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {GAME_TYPES.map((g) => (
                    <option key={g.value} value={g.value} className="bg-background text-foreground">
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer-event">Event Style / Theme</Label>
                <select
                  id="offer-event"
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {EVENT_THEMES.map((e) => (
                    <option key={e.value} value={e.value} className="bg-background text-foreground">
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !newTitle.trim()}>
                  {creating ? "Creating..." : "Create Offer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

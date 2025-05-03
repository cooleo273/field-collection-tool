import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { getLocations } from "@/lib/services/locations";
import { assignPromoterToLocation, getPromoterLocationAssignment } from "@/lib/services/users";
import { LoadingSpinner } from "@/components/loading-spinner";

interface AssignLocationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  promoter: any;
}

export function AssignLocationsDialog({
  open,
  onOpenChange,
  onSuccess,
  promoter,
}: AssignLocationsDialogProps) {
  const { toast } = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, promoter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all locations
      const locationsData = await getLocations();
      setLocations(locationsData);
      
      // Get current assignment if any
      const assignment = await getPromoterLocationAssignment(promoter.id);
      
      // Set the initially selected location if the promoter has one
      if (assignment && assignment.location_id) {
        setSelectedLocation(assignment.location_id);
      } else {
        setSelectedLocation("");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error loading data",
        description: "There was a problem loading the locations or current assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLocation) {
      toast({
        title: "No location selected",
        description: "Please select a location to assign to this promoter.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await assignPromoterToLocation(promoter.id, selectedLocation);
      toast({
        title: "Location assigned",
        description: `The promoter has been assigned to the selected location.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning location:", error);
      toast({
        title: "Error assigning location",
        description: "There was a problem assigning the location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Location to {promoter?.name}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Select a location</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    A promoter can only be assigned to one location at a time.
                  </p>
                  {locations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No locations available.</p>
                  ) : (
                    <RadioGroup value={selectedLocation} onValueChange={setSelectedLocation}>
                      {locations.map((location) => (
                        <div key={location.id} className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value={location.id} id={location.id} />
                          <Label htmlFor={location.id} className="cursor-pointer">
                            {location.name}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Assigning..." : "Assign Location"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
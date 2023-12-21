import React, { useState, useEffect } from "react";
import { StagePanelLocation, StagePanelSection, UiItemsProvider, Widget, WidgetState, useActiveViewport } from "@itwin/appui-react";
import { Point3d } from "@itwin/core-geometry";
import { Button, Select, Textarea, ToggleSwitch } from "@itwin/itwinui-react";
import MarkerPinApi from "./MarkerPinApi";
import { MarkerPinDecorator } from "./common/marker-pin/MarkerPinDecorator";

interface IssueMarker {
  point: Point3d;
  issueType: "float" | "road" | "lightening" | "user";
  description: string;
  photo?: File;
}

const DigercodWidget = () => {
  const viewport = useActiveViewport();
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const [selectedIssueType, setSelectedIssueType] = useState<"float" | "road" | "lightening">("float");
  const [description, setDescription] = useState<string>("");
  const [photo, setPhoto] = useState<File | undefined>(undefined);
  const [markers, setMarkers] = useState<IssueMarker[]>([]);
  const [userLocation, setUserLocation] = useState<Point3d | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userGeoLocation: Point3d = new Point3d(position.coords.longitude, position.coords.latitude, 0);
        setUserLocation(userGeoLocation);
      },
      (error) => {
        console.error("Error getting user's geolocation:", error.message);
        const defaultLocation = new Point3d(50, 6, 0);
        setUserLocation(defaultLocation);
      }
    );
  }, []);

  useEffect(() => {
    if (!MarkerPinApi._images) {
      console.error("Images are not loaded yet.");
      return;
    }

    // Other setup steps after images are loaded
    console.log("Images are loaded:", MarkerPinApi._images);
  }, []);

  const handleAddMarkerClick = () => {
    if (!viewport) {
      console.error("Viewport is not available.");
      return;
    }

    if (!userLocation) {
      console.error("User location is not available.");
      return;
    }

    // Add a marker for the user's geolocation using MarkerPinApi
    MarkerPinApi.addMarkerPoint(MarkerPinApi.setupDecorator(), userLocation, MarkerPinApi._images.get("pin_google_maps.svg")!);

    // Add a marker to your local state (if needed)
    addMarker(userLocation, selectedIssueType);
  };

  const addMarker = (point: Point3d, issueType: "float" | "road" | "lightening" | "user") => {
    const newMarker: IssueMarker = {
      point,
      issueType,
      description,
      photo,
    };

    // Use MarkerPinApi to add a marker
    MarkerPinApi.addMarkerPoint(MarkerPinApi.setupDecorator(), newMarker.point, MarkerPinApi._images.get("pin_google_maps.svg")!);

    setMarkers([...markers, newMarker]);
    setDescription("");
    setPhoto(undefined);

    // Add a comment here indicating that a marker has been added to the map
    console.log(`Marker added at Latitude: ${point.y.toFixed(6)}, Longitude: ${point.x.toFixed(6)}`);
  };

  const handleToggleMarkers = () => {
    setShowMarkers(!showMarkers);
  };

  const handleIssueTypeChange = (value: "float" | "road" | "lightening") => {
    setSelectedIssueType(value);
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setPhoto(selectedFile);
  };

  return (
    <div className="digercod-widget">
      {showMarkers && userLocation && (
        <div className="user-location">
          <p>User's Geolocation:</p>
          <p>Latitude: {userLocation.y.toFixed(6)}</p>
          <p>Longitude: {userLocation.x.toFixed(6)}</p>
        </div>
      )}

      <ToggleSwitch
        className="toggle-markers"
        label="Show Markers"
        labelPosition="right"
        checked={showMarkers}
        onChange={handleToggleMarkers}
      />
      <Select
        className="select-issue-type"
        placeholder="Select Issue Type"
        options={[
          { value: "float", label: "Float" },
          { value: "road", label: "Road" },
          { value: "lightening", label: "Lightening" },
        ]}
        value={selectedIssueType}
        onChange={(value) => handleIssueTypeChange(value as "float" | "road" | "lightening")}
      />
      <Textarea
        className="description-input"
        placeholder="Describe the issue..."
        value={description}
        onChange={handleDescriptionChange}
      />
      {/* Add input for photo upload */}
      <input type="file" accept="image/*" onChange={handlePhotoChange} />

      <Button className="add-marker-button" onClick={handleAddMarkerClick}>
        Add Marker
      </Button>

      {/* Display photos for each marker */}
      {markers.map((marker, index) => (
        <div key={index} className="marker-item">
          <p>Marker at Latitude: {marker.point.y.toFixed(6)}, Longitude: {marker.point.x.toFixed(6)}</p>
          <p>Description: {marker.description}</p>
          {marker.photo && <img src={URL.createObjectURL(marker.photo)} alt="Marker Photo" />}
        </div>
      ))}
    </div>
  );
};

export class DigercodWidgetProvider implements UiItemsProvider {
  public readonly id: string = "DigercodWidgetProvider";

  public provideWidgets(
    _stageId: string,
    _stageUsage: string,
    location: StagePanelLocation,
    _section?: StagePanelSection
  ): ReadonlyArray<Widget> {
    const widgets: Widget[] = [];
    if (location === StagePanelLocation.Bottom) {
      widgets.push({
        id: "DigercodWidget",
        label: "Digercod Widget",
        defaultState: WidgetState.Open,
        content: <DigercodWidget />,
      });
    }
    return widgets;
  }
}

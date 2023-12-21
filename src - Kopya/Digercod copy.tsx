import React, { useState, useEffect } from "react";
import {
  StagePanelLocation,
  StagePanelSection,
  UiItemsProvider,
  Widget,
  WidgetState,
  useActiveViewport,
} from "@itwin/appui-react";
import { Point3d } from "@itwin/core-geometry";
import { Button, Select, Textarea, ToggleSwitch } from "@itwin/itwinui-react";

interface IssueMarker {
  point: Point3d;
  issueType: "float" | "road" | "lightening";
}

const DigercodWidget = () => {
  const viewport = useActiveViewport();
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const [selectedIssueType, setSelectedIssueType] = useState<"float" | "road" | "lightening">("float");
  const [description, setDescription] = useState<string>("");
  const [markers, setMarkers] = useState<IssueMarker[]>([]);
  const [userLocation, setUserLocation] = useState<Point3d | undefined>(undefined);

  useEffect(() => {
    // Fetch user's geolocation
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation(new Point3d(position.coords.longitude, position.coords.latitude, 0));
      },
      (error) => {
        console.error("Error fetching geolocation:", error.message);
      }
    );
  }, []);

  const addMarker = (point: Point3d) => {
    const newMarker: IssueMarker = {
      point,
      issueType: selectedIssueType,
    };
    setMarkers([...markers, newMarker]);
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

  const handleAddMarkerClick = () => {
    // Assuming the user has selected a point in the viewport to add the marker.
    // You might want to implement a mechanism to get the selected point.
    const selectedPoint: Point3d = new Point3d(50,6,0);
    addMarker(selectedPoint);
  };

  return (
    <div className="digercod-widget">
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
      <Button className="add-marker-button" onClick={handleAddMarkerClick}>
        Add Marker
      </Button>

      {/* Display user's geolocation */}
      {userLocation && (
        <div className="user-location">
          <p>User's Geolocation:</p>
          <p>Latitude: {userLocation.y.toFixed(6)}</p>
          <p>Longitude: {userLocation.x.toFixed(6)}</p>
        </div>
      )}

      {/* Display markers on the map */}
      {showMarkers &&
        markers.map((marker, index) => (
          <div
            key={index}
            className={`marker ${marker.issueType}`}
            style={{ left: marker.point.x, top: marker.point.y }}
            title={`Issue Type: ${marker.issueType}\nDescription: ${description}`}
          />
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

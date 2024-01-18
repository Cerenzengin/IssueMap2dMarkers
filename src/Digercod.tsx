import React, { useState, useEffect } from "react";
import { StagePanelLocation, StagePanelSection, UiItemsProvider, Widget, WidgetState, useActiveViewport } from "@itwin/appui-react";
import { Point3d } from "@itwin/core-geometry";
import { Button, Select, Textarea, ToggleSwitch, Alert } from "@itwin/itwinui-react";
import MarkerPinApi from "./MarkerPinApi";
import { MarkerPinDecorator } from "./common/marker-pin/MarkerPinDecorator";
import GeoLocationApi from "./GeoLocationApi";
import { Cartographic } from "@itwin/core-common";
import { imageElementFromUrl, IModelApp } from "@itwin/core-frontend";
import HeatmapDecorator from "./HeatmapDecorator"; // Import HeatmapDecorator from your HeatmapDecorator.tsx file
import { mongoAppApi } from "./common/mongo";
import HeatmapDecoratorApi from "./HeatmapDecoratorApi";

export interface IssueMarker {
  point: Point3d;
  issueType: "float" | "road" | "lightening" | "maintenance" | "noise" | "crime" | "traffic congestion" | "garbage" | "other";
  description: string;
  photo?: File;
}

const DigercodWidget = () => {
  const viewport = useActiveViewport();
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const [imagesLoadedState, setImagesLoadedState] = React.useState<boolean>(false);
  const [selectedIssueType, setSelectedIssueType] = useState<"float" | "road" | "lightening"  | "maintenance" | "noise" | "crime" | "traffic congestion" | "garbage"| "other">("float")
  const [description, setDescription] = useState<string>("");
  const [photo, setPhoto] = useState<File | undefined>(undefined);
  const [markers, setMarkers] = useState<IssueMarker[]>([]);
  const [userLocation, setUserLocation] = useState<Point3d | null>(null);
  const [markerPinDecorator] = React.useState<MarkerPinDecorator>(() => {
    return MarkerPinApi.setupDecorator();
  });
  const [heatmapDecorator] = React.useState<HeatmapDecorator>(() => {
    return new HeatmapDecorator();
  });
  const [inserted, setInserted] = React.useState<boolean>(false);
  
  /** Load the images on widget startup */
  useEffect(() => {
    MarkerPinApi._images = new Map();
    const p1 = imageElementFromUrl("pin_google_maps.svg").then((image) => {
      MarkerPinApi._images.set("pin_google_maps.svg", image);
    });
    const p2 = imageElementFromUrl("pin_celery.svg").then((image) => {
      MarkerPinApi._images.set("pin_celery.svg", image);
    });
    const p3 = imageElementFromUrl("pin_poloblue.svg").then((image) => {
      MarkerPinApi._images.set("pin_poloblue.svg", image);
    });

    Promise.all([p1, p2, p3])
      .then(() => setImagesLoadedState(true))
      .catch((error) => console.error(error));
  }, []);



  useEffect(() => {
    // Load and display heatmap
    if (userLocation && markers.length > 0) {
      const points = markers.map(marker => marker.point);

      heatmapDecorator.setPoints(points);
      heatmapDecorator.setSpreadFactor(10); // Adjust the spread factor as needed
      HeatmapDecoratorApi.enableDecorations(heatmapDecorator);
    }
  }, [userLocation, markers]);


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
    if (viewport) {
      viewport.viewFlags = viewport?.viewFlags.with("backgroundMap", true);
      const fmtr = IModelApp.quantityFormatter;
      fmtr.setActiveUnitSystem("metric")
      GeoLocationApi.travelTo(viewport, "Aachen, DE");
    }
    MarkerPinApi.enableDecorations(markerPinDecorator);

  }, [viewport, markerPinDecorator]);

  useEffect(() => {
    if (!MarkerPinApi._images) {
      console.error("Images are not loaded yet.");
      return;
    }

    // Other setup steps after images are loaded
    console.log("Images are loaded:", MarkerPinApi._images);
  }, []);

  const handleAddMarkerClick = async () => {
    setInserted(false);
    if (!viewport) {
      console.error("Viewport is not available.");
      return;
    }
  
    if (!userLocation) {
      console.error("User location is not available.");
      return;
    }
    const cartesian : Cartographic[] =  [];
    cartesian.push(Cartographic.fromDegrees({longitude : userLocation.x, latitude : userLocation.y, height : 0}))
    const spatialLocation = await IModelApp.viewManager.selectedView!.iModel.spatialFromCartographic(cartesian);
    
    const newMarker: IssueMarker = {
      point: spatialLocation[0],
      issueType: selectedIssueType,
      description,
      photo,
    };

    setMarkers([...markers, newMarker]);
    setDescription("");
    setPhoto(undefined);

    const insertionResponse = await mongoAppApi.insertIssue(selectedIssueType, description, spatialLocation[0].x, spatialLocation[0].y)
    console.log(insertionResponse)
    setInserted(true);

        // Use MarkerPinApi to add a marker
    MarkerPinApi.addDigerMarkerPoint(markerPinDecorator, spatialLocation[0], MarkerPinApi._images.get("pin_google_maps.svg")!);

    console.log(`Marker added at Latitude: ${userLocation.y.toFixed(6)} = ${spatialLocation[0].y}, Longitude: ${userLocation.x.toFixed(6)} = ${spatialLocation[0].x}}`);

  };
  
  const _loadMongoData = async () => {
    if (imagesLoadedState) {
      MarkerPinApi.clearAllMarkers(markerPinDecorator);
      const allIssues = await mongoAppApi.getAllIssues()
      allIssues.forEach((issue: any) => {
        MarkerPinApi.addDigerMarkerPoint(markerPinDecorator,  new Point3d(issue.longitude, issue.latitude, 0), MarkerPinApi._images.get("pin_google_maps.svg")!);
      });
    }
    else {
      alert("Images are not loaded yet.");
    }
  }

  const handleToggleMarkers = () => {
    setShowMarkers(!showMarkers);
  };

  const handleIssueTypeChange = (value: "float" | "road" | "lightening"  | "maintenance" | "noise" | "crime" | "traffic congestion" | "garbage" | "other") => {
    setSelectedIssueType(value);
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setPhoto(selectedFile);
  };

  const renderInsertionAlert = () => {
    return (
      <Alert 
        type="positive"
        onClose={() => setInserted(false)}>
        Insertion has been made.
      </Alert>
    );
  }

  return (
    <div className="digercod-widget">
      {showMarkers && userLocation && (
        <div className="user-location">
          <p>User's Geolocation:</p>
          <p>Latitude: {userLocation.y.toFixed(6)}</p>
          <p>Longitude: {userLocation.x.toFixed(6)}</p>
        </div>
      )}

      {inserted ? renderInsertionAlert(): <></>}

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
          { value: "maintenance", label: "Maintenance" },
          { value: "noise", label: "Noise" },
          { value: "crime", label: "Crime" },
          { value: "traffic congestion", label: "Traffic Congestion" },
          { value: "garbage", label: "Garbage" },
          { value: "other", label: "Other" },

        ]}
        value={selectedIssueType}
        onChange={(value) => handleIssueTypeChange(value as "float" | "road" | "lightening"  | "maintenance" | "noise" | "crime" | "traffic congestion" | "garbage" | "other")}
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
      <Button styleType="high-visibility" className="load-mongo-data-btn" onClick={() => _loadMongoData()}>See All Issues</Button>

      {/* Display photos for each marker */}
      {showMarkers && markers.map((marker, index) => (
        <div key={index} className="marker-item">
          <p>Marker at Latitude: {marker.point.y.toFixed(6)}, Longitude: {marker.point.x.toFixed(6)}</p>
          <p>Description: {marker.description}</p>
          {marker.photo && <img src={URL.createObjectURL(marker.photo)} alt="Marker Photo" style={{ width: '200px', height: 'auto' }} />}
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

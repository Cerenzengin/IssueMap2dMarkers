import React, { useEffect, useState } from "react";
import {
  StagePanelLocation,
  StagePanelSection,
  UiItemsProvider,
  useActiveViewport,
  Widget,
  WidgetState,
} from "@itwin/appui-react";
import { Alert, Button } from "@itwin/itwinui-react";
import { Point3d, Range2d } from "@itwin/core-geometry";
import { Cartographic } from "@itwin/core-common";
import HeatmapDecorator from "./HeatmapDecorator";
import HeatmapDecoratorApi from "./HeatmapDecoratorApi";
import { IModelApp } from "@itwin/core-frontend";
import GeoLocationApi from "./GeoLocationApi";
import { MongoPointGenerator } from './common/point-selector/PointGenerators';
import { mongoAppApi } from "./common/mongo";

interface IssueMarker {
  _id: string;
  issueType: string;
  description: string;
  latitude: number;
  longitude: number;
}

export const HeatmapDecoratorWidget: React.FC = () => {
  const viewport = useActiveViewport();
  const [heatmapDecorator, setHeatmapDecorator] = useState(new HeatmapDecorator());
  const [userLocation, setUserLocation] = useState<Point3d | null>(null);
  const [modelSpaceLocation, setModelSpaceLocation] = useState<Point3d | null>(null);
  const [isHeatmapDisplayed, setIsHeatmapDisplayed] = useState(false);
  const [mongoData, setMongoData] = useState<IssueMarker[]>([]); // State for MongoDB data

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userGeoLocation = new Point3d(position.coords.longitude, position.coords.latitude, 0);
        setUserLocation(userGeoLocation);

        const cartographic = Cartographic.fromDegrees({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          height: 0,
        });

        const spatialLocation = await IModelApp.viewManager.selectedView!.iModel.spatialFromCartographic([cartographic]);
        if (spatialLocation.length > 0) {
          setModelSpaceLocation(spatialLocation[0]);

          // Fetch MongoDB data and set it in state
          const mongoIssues = await mongoAppApi.getAllIssues();
          setMongoData(mongoIssues);

          // Generate and display heatmap based on MongoDB data
          generateHeatmap(mongoIssues);
        }
      },
      (error) => {
        console.error("Error getting user's geolocation:", error.message);
      }
    );
  }, [viewport]);

  const generateHeatmap = (data: IssueMarker[]) => {
    const mongoGenerator = new MongoPointGenerator(data); // Create a MongoPointGenerator instance

    // Calculate the range that encompasses all issue locations
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = -Number.MAX_VALUE;
    let maxY = -Number.MAX_VALUE;

    for (const issue of data) {
      minX = Math.min(minX, issue.longitude);
      minY = Math.min(minY, issue.latitude);
      maxX = Math.max(maxX, issue.longitude);
      maxY = Math.max(maxY, issue.latitude);
    }

    const range = Range2d.createXYXY(minX, minY, maxX, maxY);

    // Generate points for all issues within the calculated range
    const points = mongoGenerator.generatePoints(range);
    
    heatmapDecorator.setRange(range); // Set range based on issue locations
    heatmapDecorator.setPoints(points);
    heatmapDecorator.setSpreadFactor(2); // Adjust as needed
    heatmapDecorator.setHeight(0);
    HeatmapDecoratorApi.enableDecorations(heatmapDecorator);
    setIsHeatmapDisplayed(true);
  };

  const toggleHeatmap = () => {
    if (isHeatmapDisplayed) {
      HeatmapDecoratorApi.disableDecorations(heatmapDecorator);
    } else {
      generateHeatmap(mongoData); // Regenerate and display the heatmap
    }
    setIsHeatmapDisplayed(!isHeatmapDisplayed);
  };

  return (
    <div className="sample-options">
      <div className="sample-grid">
        <Alert type="informational" className="no-icon">
          Click the button to display the heatmap.
        </Alert>
        <Button onClick={toggleHeatmap}>
          {isHeatmapDisplayed ? "Hide Heatmap" : "Show Heatmap"}
        </Button>
        {isHeatmapDisplayed && (
          <div>
            <p>Heatmap displayed on the map.</p>
            <p>Model Space Coordinates: X: {modelSpaceLocation?.x.toFixed(6)}, Y: {modelSpaceLocation?.y.toFixed(6)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export class HeatmapDecoratorWidgetProvider implements UiItemsProvider {
  public readonly id = "HeatmapDecoratorWidgetProvider";

  public provideWidgets(_stageId: string, _stageUsage: string, location: StagePanelLocation, _section?: StagePanelSection): ReadonlyArray<Widget> {
    const widgets: Widget[] = [];
    if (location === StagePanelLocation.Right) {
      widgets.push({
        id: "HeatmapDecoratorWidget",
        label: "Heatmap Decorator Selector",
        defaultState: WidgetState.Open,
        content: <HeatmapDecoratorWidget />,
      });
    }
    return widgets;
  }
};

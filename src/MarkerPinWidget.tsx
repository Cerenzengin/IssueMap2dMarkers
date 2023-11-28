/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import React, { useEffect } from "react";
import {
  StagePanelLocation,
  StagePanelSection,
  UiItemsProvider,
  useActiveViewport,
  Widget,
  WidgetState
} from "@itwin/appui-react";
import { imageElementFromUrl, IModelApp } from "@itwin/core-frontend";
import { Point3d, Range2d } from "@itwin/core-geometry";
import { Alert, Button, Fieldset, RadioTile, RadioTileGroup, ToggleSwitch } from "@itwin/itwinui-react";
import { MarkerData, MarkerPinDecorator } from "./common/marker-pin/MarkerPinDecorator";
import { PlaceMarkerTool } from "./common/marker-pin/PlaceMarkerTool";
import { PopupMenu } from "./common/marker-pin/PopupMenu";
import { PointSelector } from "./common/point-selector/PointSelector";
import MarkerPinApi from "./MarkerPinApi";
import "./MarkerPin.scss";

interface ManualPinSelection {
  name: string;
  image: string;
}

/** A static array of pin images. */
const manualPinSelections: ManualPinSelection[] = [
  { image: "pin_google_maps.svg", name: "Google Pin" },
  { image: "pin_celery.svg", name: "Celery Pin" },
  { image: "pin_poloblue.svg", name: "Polo blue Pin" },
];

const MarkerPinWidget = () => {
  const viewport = useActiveViewport();
  const [imagesLoadedState, setImagesLoadedState] = React.useState<boolean>(false);
  const [showDecoratorState, setShowDecoratorState] = React.useState<boolean>(true);
  const [manualPinState, setManualPinState] = React.useState<ManualPinSelection>(manualPinSelections[0]);
  const [markersDataState, setMarkersDataState] = React.useState<MarkerData[]>([]);
  const [rangeState, setRangeState] = React.useState<Range2d>(Range2d.createNull());
  const [heightState, setHeightState] = React.useState<number>(0);
  const [markerPinDecorator] = React.useState<MarkerPinDecorator>(() => {
    return MarkerPinApi.setupDecorator();
  });

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

  /** Initialize Decorator */
  useEffect(() => {
    MarkerPinApi.enableDecorations(markerPinDecorator);
    return () => {
      MarkerPinApi.disableDecorations(markerPinDecorator);
    };
  }, [markerPinDecorator]);

  /** When the images are loaded, initialize the MarkerPin */
  useEffect(() => {
    if (!imagesLoadedState)
      return;

    void IModelApp.localization.registerNamespace("marker-pin-i18n-namespace");
    PlaceMarkerTool.register("marker-pin-i18n-namespace");
    MarkerPinApi.setMarkersData(markerPinDecorator, markersDataState);

    if (viewport)
      viewInit();
    else
      IModelApp.viewManager.onViewOpen.addOnce(() => viewInit());

    return () => {
      IModelApp.localization.unregisterNamespace("marker-pin-i18n-namespace");
      IModelApp.tools.unRegister(PlaceMarkerTool.toolId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesLoadedState]);

  useEffect(() => {
    if (showDecoratorState)
      MarkerPinApi.enableDecorations(markerPinDecorator);
    else
      MarkerPinApi.disableDecorations(markerPinDecorator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDecoratorState]);

  useEffect(() => {
    MarkerPinApi.setMarkersData(markerPinDecorator, markersDataState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markersDataState]);

  const viewInit = () => {
    if (!viewport)
      return;

    // Grab range of the contents of the view. We'll use this to position the random markers.
    const range3d = viewport.view.computeFitRange();
    const range = Range2d.createFrom(range3d);

    // Grab the max Z for the view contents.  We'll use this as the plane for the auto-generated markers. */
    const height = range3d.zHigh;

    setRangeState(range);
    setHeightState(height);
  };

  /** This callback will be executed when the user interacts with the PointSelector
   * UI component.  It is also called once when the component initializes.
   */
  const _onPointsChanged = async (points: Point3d[]): Promise<void> => {
    const markersData: MarkerData[] = [];
    for (const point of points) {
      point.z = heightState;
      markersData.push({ point });
    }
    setMarkersDataState(markersData);
  };

  /** This callback will be executed by the PlaceMarkerTool when it is time to create a new marker */
  const _manuallyAddMarker = (point: Point3d) => {
    MarkerPinApi.addMarkerPoint(markerPinDecorator, point, MarkerPinApi._images.get(manualPinState.image)!);
  };

  /** This callback will be executed when the user clicks the UI button.  It will start the tool which
   * handles further user input.
   */
  const _onStartPlaceMarkerTool = () => {
    void IModelApp.tools.run(PlaceMarkerTool.toolId, _manuallyAddMarker);
  };

  // Display drawing and sheet options in separate sections.
  return (
    <div className="sample-options">
      <ToggleSwitch className="show-markers" label="Show markers" labelPosition="right" checked={showDecoratorState} onChange={() => setShowDecoratorState(!showDecoratorState)} />

      <div className="sample-grid">
        <Fieldset legend="Auto-generate locations" className="point-cloud">
          <PointSelector onPointsChanged={_onPointsChanged} range={rangeState} />
        </Fieldset>
        <Fieldset legend="Manual placement" className="manual-placement">
          <RadioTileGroup>
            {manualPinSelections.map((pin, index) =>
              <RadioTile
                key={index}
                icon={<img src={pin.image} alt="pin symbol" />}
                checked={manualPinState.name === pin.name}
                onChange={() => setManualPinState(pin)}
              />)}
          </RadioTileGroup>
          <Button
            styleType="high-visibility"
            className="manual-placement-btn"
            onClick={_onStartPlaceMarkerTool}
            title="Click here and then click the view to place a new marker">Place Marker</Button>
        </Fieldset>
      </div>
      <Alert type="informational" className="instructions">
        Use the options to control the marker pins. Click a marker to open a menu of options.
      </Alert>
      <PopupMenu canvas={viewport?.canvas} />
    </div>
  );
};

export class MarkerPinWidgetProvider implements UiItemsProvider {
  public readonly id: string = "MarkerPinWidgetProvider";

  public provideWidgets(_stageId: string, _stageUsage: string, location: StagePanelLocation, _section?: StagePanelSection): ReadonlyArray<Widget> {
    const widgets: Widget[] = [];
    if (location === StagePanelLocation.Bottom) {
      widgets.push(
        {
          id: "MarkerPinWidget",
          label: "Marker Pin Selector",
          defaultState: WidgetState.Open,
          content: <MarkerPinWidget />,
        }
      );
    }
    return widgets;
  }
}

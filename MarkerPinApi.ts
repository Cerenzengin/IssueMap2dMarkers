/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { IModelApp } from "@itwin/core-frontend";
import { Point3d } from "@itwin/core-geometry";
import { MarkerData, MarkerPinDecorator } from "./common/marker-pin/MarkerPinDecorator";

// cSpell:ignore SETUPDECORATOR, SETMARKERDATA, ENABLEDECORATIONS

export default class MarkerPinApi {
  public static _images: Map<string, HTMLImageElement>;

  // START SETUPDECORATOR
  public static setupDecorator() {
    return new MarkerPinDecorator();
  }
  // END SETUPDECORATOR

  // START SETMARKERDATA
  public static setMarkersData(decorator: MarkerPinDecorator, markersData: MarkerData[]) {
    const pinImage = MarkerPinApi._images.get("pin_google_maps.svg");

    if (!pinImage)
      return;

    decorator.setMarkersData(markersData, pinImage);
  }
  // END SETMARKERDATA

  public static addMarkerPoint(decorator: MarkerPinDecorator, point: Point3d, pinImage: HTMLImageElement) {
    decorator.addPoint(point, pinImage);
  }

  // START ENABLEDECORATIONS
  public static enableDecorations(decorator: MarkerPinDecorator) {
    if (!IModelApp.viewManager.decorators.includes(decorator))
      IModelApp.viewManager.addDecorator(decorator);
  }
  // END ENABLEDECORATIONS

  public static disableDecorations(decorator: MarkerPinDecorator) {
    IModelApp.viewManager.dropDecorator(decorator);
  }
}

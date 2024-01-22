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
    console.log(`addMarkerPoint ${point} and pinImage = ${pinImage}`);
    decorator.addPoint(point, pinImage);
  }
  public static addDigerMarkerPoint(decorator: MarkerPinDecorator, point: Point3d, pinImage: HTMLImageElement) {
    console.log(`addDigerMarkerPoint ${point} and pinImage = ${pinImage}`);
    decorator.addDigerPoint(point, pinImage);
  }
  public static addDigerMarkerPointWithDetail(decorator: MarkerPinDecorator, point: Point3d, description: string, title: string, photo: string, pinImage: HTMLImageElement) {
    console.log(`addDigerMarkerPointWithDetail ${point} and pinImage = ${pinImage}`);

    decorator.addDigerPointWithDetail(point, description, title, photo, pinImage);
  }
  public static clearAllMarkers(decorator: MarkerPinDecorator)  {
    decorator.clearDigerMarkers();
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

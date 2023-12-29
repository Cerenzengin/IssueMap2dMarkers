
import { BingLocationProvider, IModelApp,  IModelConnection, queryTerrainElevationOffset
  ,ScreenViewport,SpatialViewState, Viewport, 
  } from "@itwin/core-frontend";
import { Range3d, Transform } from "@itwin/core-geometry";
import {
  BackgroundMapType,
  BaseMapLayerSettings,
  DisplayStyle3dProps,
  GlobeMode,
  SpatialViewDefinitionProps
} from "@itwin/core-common";


// GeoLocationApi.tsx



export default class GeoLocationApi {
  private static _locationProvider?: BingLocationProvider;

  public static readonly maxQueryDistance = 50000;

  public static get locationProvider(): BingLocationProvider {
    return (
      this._locationProvider ||
      (this._locationProvider = new BingLocationProvider())
    );
  }

  
  public static async getLocation(destination?: string): Promise<any> {
  return this.locationProvider.getLocation(destination || ""); // Provide a default empty string if destination is undefined
}

  public static async travelTo(
    viewport: ScreenViewport,
    destination: string
  ): Promise<boolean> {
    if (!viewport.view.is3d()) return false;

    const location = await this.getLocation(destination);
    if (!location) return false;

    const elevationOffset = await queryTerrainElevationOffset(
      viewport,
      location.center
    );
    if (elevationOffset !== undefined) location.center.height = elevationOffset;

    let viewArea: Range3d;
    if (location.area) {
      const northeastPoint = viewport.view.cartographicToRoot(
        location.area.northeast
      );
      const southwestPoint = viewport.view.cartographicToRoot(
        location.area.southwest
      );

      if (!northeastPoint || !southwestPoint) return false;

      viewArea = Range3d.create(northeastPoint, southwestPoint);
    } else {
      const center = viewport.view.cartographicToRoot(location.center);
      if (!center) return false;

      let transformation = Transform.createTranslationXYZ(100, 100, 100);
      const corner1 = transformation.multiplyPoint3d(center);
      transformation = Transform.createTranslationXYZ(-100, -100, -100);
      const corner2 = transformation.multiplyPoint3d(center);

      viewArea = Range3d.create(corner1, corner2);
    }

    viewport.zoomToVolume(viewArea);
    return true;
  }

  public static setMap(viewport: Viewport, streetsOnlyMap: boolean) {
    if (!viewport.view.is3d()) return;

    const displayStyle = viewport.view.getDisplayStyle3d();

    if (streetsOnlyMap) {
      displayStyle.backgroundMapBase = BaseMapLayerSettings.fromJSON({
        formatId: "TileURL",
        url: "https://b.tile.openstreetmap.org/{level}/{column}/{row}.png",
        name: "openstreetmap",
      });
    } else {
      displayStyle.changeBackgroundMapProvider({
        name: "BingProvider",
        type: BackgroundMapType.Hybrid,
      });
    }
  }
}
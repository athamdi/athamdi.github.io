declare namespace GeoJSON {
  type Position = [number, number];

  interface Polygon {
    type: "Polygon";
    coordinates: Position[][];
  }
}

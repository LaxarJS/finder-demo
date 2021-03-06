# GeocodingActivity

> This activity returns a list of possible coordinates for a location.


## Content
* [Usage](#usage)
* [References](#references)


## Usage

### Installation

For installation instruction take a look at the [LaxarJS documentation](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/installing_widgets.md).


### Configuration example

```json
{
   "widget": "finder-demo/language-selection-activity",
   "features": {
      "search": {
         "resource": "searchString"
      },
      "locations": {
         "resource": "availableLocations",
         "searching": "geocodingInProgress"
      }
   }
}
```
Use this configuration on a page to get a GeocodingActivity instance.

Although the `locations.searching` flag is not mandatory, it should always be configured.
It informs widgets displaying results based on geocoding that a search is still ongoing and results may be available soon.
For example the *OpenStreetMapWidget* provides the counterpart as feature `locations.searchingOn`.


## References

The following resources are useful or necessary for the understanding of this document.
The links refer to the latest version of the documentation.
Refer to the [bower.json](./bower.json) for the specific version that is relevant for this document.

* [LaxarJS Concepts]
* [LaxarJS Patterns]

[LaxarJS Concepts]: https://github.com/LaxarJS/laxar/blob/master/docs/concepts.md "LaxarJS Concepts"
[LaxarJS Patterns]: https://github.com/LaxarJS/laxar-patterns/blob/master/docs/index.md "LaxarJS Patterns"

...

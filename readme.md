[![Build Status](https://travis-ci.org/collingo/mapper.svg)](https://travis-ci.org/collingo/mapper)

# Mapper

Builds a ViewModel (simple JS object) from a live data store (such as Firebase) and a mapping definition. Optionally listens for change events on the store and updates the ViewModel.

Utilises the adaptor patterns so should be comptible with any number of data stores so long as an adaptor is written. Please see collingo/mapper-firebase for an example.

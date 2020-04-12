# Text to image

[![Join the chat at https://gitter.im/bostrom/text-to-image](https://badges.gitter.im/bostrom/text-to-image.svg)](https://gitter.im/bostrom/text-to-image?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Dependency Status](https://img.shields.io/david/bostrom/text-to-image.svg)](https://david-dm.org/bostrom/text-to-image)
[![devDependency Status](https://img.shields.io/david/dev/bostrom/text-to-image.svg)](https://david-dm.org/bostrom/text-to-image#info=devDependencies)
[![Build Status](https://img.shields.io/travis/bostrom/text-to-image.svg)](https://travis-ci.org/bostrom/text-to-image)
[![Code Coverage](https://img.shields.io/coveralls/bostrom/text-to-image.svg)](https://coveralls.io/github/bostrom/text-to-image)
[![Npm Version](https://img.shields.io/npm/v/text-to-image.svg)](https://www.npmjs.com/package/text-to-image)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](https://opensource.org/licenses/ICS)

A library for generating an image data URI representing an image containing the text of your choice.

Originally part of a Twitter bot for publishing tweets longer than 140 characters, the generator takes a string and an optional configuration object as parameters and returns a [promise](http://bluebirdjs.com/docs/why-promises.html) that will resolve to a image data URI (`data:image/png;base64,iVBORw0KGgoAAAA...`)

There is also a synchronous variant that returns the data URI directly.

## Installation

    npm i text-to-image

Note that text-to-image uses [node-canvas](https://github.com/Automattic/node-canvas) to generate images. For text-to-image to install, you might have to fulfill the [installation requirements for node-canvas](https://github.com/Automattic/node-canvas#installation). Please refer to their documentation for instructions.

## Usage

    const textToImage = require('text-to-image');
    textToImage.generate('Lorem ipsum dolor sit amet').then(function (dataUri) {
      console.log(dataUri);
    });

The above script will print the full generated data URI to the console.

    data:image/png;base64,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

Copy that line into the address field of your browser and you should see the generated image.

The image generator will adjust the height of the image automatically to fit all text, while the width of the image is fixed to the specified width.

Line breaks can be forced with `\n`.

## Configuring

The `generate` and `generateSync` function takes an optional second parameter containing configuration options for the image. All configuraion parameters are optional. The available options are as follows.

| Name          | Default value | Description                                                                                                                      |
| :------------ | :------------ | :------------------------------------------------------------------------------------------------------------------------------- |
| maxWidth      | 400           | Sets the width of the generated image in pixels.                                                                                 |
| fontSize      | 18            | The font size to use for the text in the image.                                                                                  |
| fontFamily    | Helvetica     | The font family to use for the text in the image.                                                                                |
| fontWeight    | normal        | The font weight to use for the text in the image.                                                                                |
| lineHeight    | 28            | The line height for the generated text.                                                                                          |
| textAlign     | left          | The text alignment for the generated text (possible values: left, start, center, right, end).                                    |
| margin        | 10            | The margin (all sides) between the text and the border of the image.                                                             |
| bgColor       | #FFFFFF       | Sets the background color of the image.                                                                                          |
| textColor     | #000000       | Sets the text color.                                                                                                             |
| customHeight  | 0             | Sets the height of the generated image in pixels. If falsy, will automatically calculate the height based on the amount of text. |
| debug         | false         | Set to true to turn on debug mode (see below).                                                                                   |
| debugFilename | timestamp     | Set a custom file name for the file created in debug mode. Defaults to a timestamp with a `.png` extension.                      |

Example:

    const textToImage = require('text-to-image');
    textToImage.generate('Lorem ipsum dolor sit amet', {
      debug: true,
      maxWidth: 720,
      fontSize: 18,
      fontFamily: 'Arial',
      lineHeight: 30,
      margin: 5,
      bgColor: "blue",
      textColor: "red"
    }).then(function (dataUri) {
      console.log(dataUri);
    });

## Debugging

Turn on debug mode to have the library store the generated image data URI as a PNG in the current working directory (where the process was started). The image name will be the current date and time.

## Test

The library is tested using Jest. Run the test suit by executing

    npm test

A coverage report will be generated in `coverage/`.

## Contributing

Pull requests are welcome. Read the [Contributing guidelines](./CONTRIBUTING.md).

## License

[ISC License (ISC)](./LICENSE)

const Clarifai = require('clarifai');

const clarifaiApp = new Clarifai.App({
    apiKey: 'b173d943342c43fcb622be386881121e'
})

clarifaiApp.models.predict({id: 'classifier-1', version: 'a13e72b5029840c8a878aadc0380eb87'}, 'https://irisprodeutraining.blob.core.windows.net/i-e575b20aa8a0485a9a8de8b729b75bce/i-171e110859074093a136c9f17cf05223?sv=2017-04-17&sr=b&sig=k935NRQqOTEJhWv3i1r4StpNiwZY9shwwl6MLIXDa7Q%3D&se=2019-12-19T10%3A24%3A20Z&sp=r').
then((r) => {
    console.log(r)
})

clarifaiApp.inputs.create()



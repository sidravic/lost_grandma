let __G = {};

__G = (($, Glance) => {
    Glance.SearchByImage = {};

    const handleSubmit = (e) => {

        e.preventDefault();
        const currentUrl = window.location.href;
        const targetClassifier =  currentUrl.split('/')[5]

        let imageUrl = $('#input-search-image-url').val();

        if((!imageUrl) || (imageUrl.trim() == '')) {
            alert('Please enter a valid image url');
        };

        let data = {image_url: imageUrl, responseType: 'html'};
        let targetUrl = '/api/v1/' + targetClassifier + '/predict';

        $.ajax({
            url: targetUrl,
            type: 'post',
            data: JSON.stringify(data),
            contentType: 'application/json',
            complete: (response) => {
                console.log(response);
                $("#search-results").html(response.responseText);
            }
        })

    }

    Glance.SearchByImage.search = () => {
        let searchByImageUrlForm = $('#search-by-image-url form');
        searchByImageUrlForm.on('submit', handleSubmit);
    }

    Glance.SearchByImage.handleSearchedUrl = () => {

        $('#input-search-image-url').change(() => {
            let imageUrl = $('#input-search-image-url').val();
            let imageElement = '<img src="' + imageUrl + '" style="width:18rem;height:18rem">';
            $('#searched-image').html(imageElement);
        })
    }

    $(document).ready(() => {
     

        Glance.SearchByImage.search();
        Glance.SearchByImage.handleSearchedUrl();
    });
})(jQuery, __G);
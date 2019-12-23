let __G = {};

__G = (($, Glance) => {
    Glance.SearchByImage = {};

    const handleSubmit = (e) => {

        e.preventDefault();
        let imageUrl = $('#input-search-image-url').val();

        if((!imageUrl) || (imageUrl.trim() == '')) {
            alert('Please enter a valid image url');
        };

        let data = {image_url: imageUrl, responseType: 'html'};
        console.log(data);

        $.ajax({
            url: '/api/v1/predict',
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
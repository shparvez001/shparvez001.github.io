//multi dimensional array search

//A basic 2d search

function arraySearch2D(arrayName,searchTerm)
{
		var i=0;
		for(i=0;i<arrayName.length;i++)
		{
			var insideArray=arrayName[i];
			if (insideArray.indexOf(searchTerm)>-1)
			{
				//return arrayName[i][insideArray.indexOf(searchTerm)];
				return i+','+insideArray.indexOf(searchTerm);
			}
		}
}
//eg: arraySearch2D(projects,"weather")



//Image gallery fenction begins

function insertGallery(containerName,galleryName,galleryBaseLink,galleryImages)
{	
	var galleryContent="";
	var modalContent="";
	var noOfColumns=4;
	
	document.getElementById(containerName).innerHTML='<h2 class="mb-5" id="gallery-name"> </h2><div id="gallery-content"></div>';
	document.getElementById("gallery-name").innerHTML=galleryName;
	galleryContent+='<div class="row">';
	modalContent+='<div id="galleryModal" class="modal" ><span class="close cursor" onclick="closeModal()">&times;</span><div class="modal-content">';
	var i=0;
	var j=0;
	var imagePerColumn=galleryImages.length/noOfColumns;
	if(!Number.isInteger(imagePerColumn))
	{
		imagePerColumn=parseInt(imagePerColumn)+1;
	}
	
	for(i=0;i<galleryImages.length;i++)
	{
		j=i+1;
		if(i%imagePerColumn==0&&i>0)
		{
			galleryContent+='</div>';	
		}
		if(i%imagePerColumn==0)
		{
			galleryContent+='<div class="column">';	
		}
		galleryContent+='<img src="'+galleryBaseLink+galleryImages[i]["name"]+'" onclick="openModal();currentSlide('+j+')" class="hover-shadow">';	
		modalContent+='<div class="mySlides" name="mySlides" title="'+galleryImages[i]["caption"]+'" ><div class="numbertext">'+j+' / '+galleryImages.length+'</div><img class="slide-image" src="'+galleryBaseLink+galleryImages[i]["name"]+'" alt="'+galleryImages[i]["caption"]+'" style="width:100%" onclick="plusSlides(1)"></div>';
	}
	galleryContent+='</div>';
	modalContent+='<a class="prev" onclick="plusSlides(-1)">&#10094;</a><a class="next" onclick="plusSlides(1)">&#10095;</a><div class="caption-container"><p id="caption"></p></div></div></div>';
	
	document.getElementById("gallery-content").innerHTML=galleryContent;
	document.getElementById("gallery-content").innerHTML+=modalContent+'<br>';
	
	if(window.screen.width<750&&window.screen.width<window.screen.height)
	{
	var all = document.getElementsByClassName('modal-content');
	for (var i = 0; i < all.length; i++) {
		//console.log(all[i]);
		all[i].className="modal-content-mobile";
	}
	}
		

document.onkeydown = function(evt) {
    evt = evt || window.event;
    //console.log(evt.keyCode);
    if (evt.ctrlKey && evt.keyCode == 90) { //Checking for undo
        alert("Ctrl-Z");
    }
    if (evt.keyCode == 27) {//Escape Pressed
        //alert("Escape ");
		closeModal();
    }
	if (evt.keyCode == 34 ||evt.keyCode == 39 ||evt.keyCode == 40 ) {//pagedown or Right or down key
		plusSlides(1);
    }
	if (evt.keyCode == 33 ||evt.keyCode == 37 ||evt.keyCode == 38 ) {//pageup or Left or up key
		plusSlides(-1);
    }
};

//Swipe detection
var container = document.getElementById("galleryModal");

  container.addEventListener("touchstart", startTouch, false);
  container.addEventListener("touchmove", moveTouch, false);

  // Swipe Up / Down / Left / Right
  var initialX = null;
  var initialY = null;

  function startTouch(e) {
    initialX = e.touches[0].clientX;
    initialY = e.touches[0].clientY;
  };

  function moveTouch(e) {
    if (initialX === null) {
      return;
    }

    if (initialY === null) {
      return;
    }

    var currentX = e.touches[0].clientX;
    var currentY = e.touches[0].clientY;

    var diffX = initialX - currentX;
    var diffY = initialY - currentY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // sliding horizontally
      if (diffX > 0) {
        // swiped left
        console.log("swiped left");
		plusSlides(1);
      } else {
        // swiped right
        console.log("swiped right");
		plusSlides(-1);
      }  
    } else {
      // sliding vertically
      if (diffY > 0) {
        // swiped up
        console.log("swiped up");
      } else {
        // swiped down
        console.log("swiped down");
      }  
    }

    initialX = null;
    initialY = null;

    e.preventDefault();
  };


}


	//Modal Functions
	// Open the Modal
	function openModal() {
	  document.getElementById("galleryModal").style.display = "block";
	  document.getElementById("sideNav").style.display = "none";
	  
	}

	// Close the Modal
	function closeModal() {
	  document.getElementById("galleryModal").style.display = "none";
	  document.getElementById("sideNav").style.display = "block";
	}

	var slideIndex = 1;
	//showSlides(slideIndex);

	// Next/previous controls
	function plusSlides(n) {
	  showSlides(slideIndex += n);
	}

	// Thumbnail image controls
	function currentSlide(n) {
	  showSlides(slideIndex = n);
	}

	function showSlides(n) {
	  var i;
	  var slides = document.getElementsByClassName("mySlides");
	  //var dots = document.getElementsByClassName("demo");  //Not using in this project
	  var captionText = document.getElementById("caption");
	  if (n > slides.length) {slideIndex = 1}
	  if (n < 1) {slideIndex = slides.length}
	  for (i = 0; i < slides.length; i++) {
		slides[i].style.display = "none";
	  }
	  /*
	  for (i = 0; i < dots.length; i++) {
		dots[i].className = dots[i].className.replace(" active", "");
	  }
	  */
	  slides[slideIndex-1].style.display = "block";
	  //dots[slideIndex-1].className += " active";
	  //captionText.innerHTML = dots[slideIndex-1].alt;
	  if(slides[slideIndex-1].title){captionText.innerHTML = slides[slideIndex-1].title;}
	  console.log(slides[slideIndex-1].title);
	}
//Image Gallery function ends


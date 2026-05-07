Sentry.init({
  dsn: "https://a6c61cae7871489aa79da1b05f0e1d9f@o404682.ingest.sentry.io/5269157",
});
const TRANSFORMATIONUI = false;
const client = filestack.init("AFr2KJdocT16BQBQZYFWcz");
client.on("upload.error", (filestackError) => {
  Sentry.captureException(filestackError);
  console.log(filestackError);
});

// FILEPICKER OPTIONS
//= ==================================

var onUploadProgress = function (evt) {
  console.log(evt.totalPercent);
};

var filePickerOptions = function (
  withTransformatioUI,
  cropOptions,
  $img,
  _this
) {
  return {
    accept: ["image/*", ".pdf"],
    maxSize: 10 * 1024 * 1024,
    transformations: {
      crop: cropOptions,
      rotate: true,
    },
    fromSources: [
      "local_file_system",
      "facebook",
      "instagram",
      "googledrive",
      "dropbox",
      "box",
    ],
    lang: "es",
    onUploadStarted: function () {
      $img.prev().hide();
      $img.attr("src", "../images/loader.gif");
    },
    onFileUploadFailed: function () {
      $img.prev().Show();
      $img.attr("src", "../images/upload555.png");
      Sentry.captureException(new Error("Filestack picker Upload failed"));
      console.log("Upload Failed");
    },
    onUploadDone: function (result) {
      $(".filepicker").css("display", "inline");
      var imageURL = result.filesUploaded[0].url;
      if (result.filesUploaded[0].mimetype === "application/pdf") {
        var handle = result.filesUploaded[0].handle;
        imageURL =
          "https://cdn.filestackcontent.com/AFr2KJdocT16BQBQZYFWcz/output=format:jpg/" +
          handle;
        window.alert(
          "Estás subiendo un archivo PDF. Se imprimirá sólo la primera página."
        );
      }
      _this.data("doc-url", imageURL);
      _this.data("filename", result.filesUploaded[0].filename);
      previewImage(imageURL, $img, function () {});
    },
    uploadInBackground: false,
  };
};

// FUNCTIONS
// ==============================

function previewImage(url, $imgSelector, callback) {
  $imgSelector.attr("src", url).on("load", callback);
}

function sendToServer() {
  let formData = {
    email: $("#email").val(),
    name: $("#name").val(),
    description: $("#description").val(),
    img: $("#collection-img").attr('src'),
    marcos: [],
  };
    $(".marco").each(function() {
      let marco = {
        name: $(this).find(".marco-name").val(),
        description: $(this).find(".marco-description").val(),
        price: $(this).find(".marco-price").val(),
        img: $(this).find("img").attr('src'),
      };
      formData.marcos.push(marco);
    });

  $.ajax({
    url: "/suscripcion/new",
    method: "POST",
    data: formData,
    dataType: "json",
  })
    .done(function (data) {
      console.log(data);
      window.location.href = 'https://clickmarqueteria.com/collections/' + data.custom_collection.handle;
    })
    .fail(function (e) {
      Sentry.captureException(e);
      console.log(e);
    });
}

/////// Marcos logic
// Add-Remove Tiles.
function addMarcos(start, end) {
  for (var i = start; i < end; i++) {
    $("#marcos").append(`<div class="marco">
                        
  <div> Marco ${i + 1}</div>
  <label for="marco-1-name">Nombre</label>
  <input type="text" class="marco-name"> 

  <label for="marco-1-description">Descripcion</label>
  <input type="text" class="marco-description"> 

  <label for="marco-1-price">Precio</label>
  <input type="text" class="marco-price"> 


  <div>
      <label for="marco-1-image">Imagen</label>
      <a class='filepicker' style="width:50px;height:50px;" href='#'>
          <img src='../images/upload.png' style="max-width:100%;max-height:200px;" />
      </a>
  </div>

</div>`);
  }
}
function removeMarcos(start, end) {
  for (var i = start; i < end; i++) {
    // Remove tiles backwards.
    $("#marcos").find(".marco:last-of-type").remove();
  }
}

// Handle input changes.
function handleInput(e) {
  var // Get input's val before change.
    oldVal = parseInt($(this).data("oldVal")),
    // Get input's val after change.
    newVal = parseInt($(this).val()),
    // Get input's max value, defined in input attribute.
    maxVal = parseInt($(this).attr("max")),
    // Get input's min value, defined in input attribute.
    minVal = parseInt($(this).attr("min"));

  // When input values are removed completely by "Delete" and "Backspace" buttons, this fix changes null to 0.
  if (!newVal) newVal = 0;

  // Allow only use of "Arrows", "Numbers", "Numpad Numbers", " Delete" and "Backspace" buttons, if value is insserted by keyboard.
  if (
    e.type == "keyup" &&
    !(
      e.which == 8 ||
      e.which == 46 ||
      (e.which > 36 && e.which < 41) ||
      (e.which > 47 && e.which < 58) ||
      (e.which > 95 && e.which < 106)
    )
  ) {
    $(this).val(oldVal);
    return false;
  }

  // Limitation fix ( For browsers that do not support input[type=number] and fallback to the input input[type=text] )
  if (newVal > maxVal) {
    newVal = maxVal;
    $(this).val(maxVal);
  }
  if (newVal < minVal) {
    newVal = minVal;
  }

  // Add - Remove tiles.
  if (newVal > oldVal) {
    //Start loop from oldVal to append tiles beggining from the last and leave previous tiles intact.
    addMarcos(oldVal, newVal);
  } else {
    // Oldval = what we had, newVal = what is left, difference = how many tiles to remove ( aka repeats of removing tiles backwards loop ).
    removeMarcos(0, oldVal - newVal);
  }

  //Update oldval for later use, if input is changed again.
  $(this).data("oldVal", newVal);
}

// DOCUMENT READY
// ==============================

$(document).ready(function () {
  $(document).on("click", ".filepicker", function () {
    const $img = $(this).find("img");
    var filepicker = client.picker(
      filePickerOptions(TRANSFORMATIONUI, false, $img, $(this))
    );
    filepicker.open();
  });

  // On submit
  $(".submit").on("click", function (e) {
    e.preventDefault();
    let collection = sendToServer();
    console.log ('collection', collection);
  });

  // marcos logic

  //Add tiles based on the on-load value of input ( Number can be changed by input attribute "value").
  addMarcos(0, parseInt($("#tilesNumber").val()));

  // Piece it up
  $("#marcosNumber")
    // Store on-load value of input.
    .data("oldVal", $("#marcosNumber").val())
    // Give focus to input. Not necessary of course. Just for immediate keyboard insert.
    .focus()
    // We update the value on blur, so if the inserted value is lower than the min limit, it changes back to the min value.
    .blur(function () {
      $(this).val($(this).data("oldVal"));
    })
    // Safari fires the change event after input loses focus.
    // So we force input to lose focus so it can be updated but we focus back so user can click the input to insert from keyboard.
    .mouseup(function () {
      $(this).blur().focus();
    })
    // Assign handleInput function to events
    .keyup(handleInput)
    .change(handleInput);
});

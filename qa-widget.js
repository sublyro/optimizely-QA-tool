if (typeof DATA != 'undefined') {
    console.log(DATA.revision);
    console.log(DATA);
}

window.QA_EXPERIMENTS = [];
window.QA_EXPERIMENTS.push('2922890583');
window.QA_EXPERIMENTS.push('2959350178');

if (typeof DATA != 'undefined') {
    (function (DATA) {
        'use strict';

        var QASessionTime = 600000; // default QA session time

        // QA node is activated by adding optimizely_qa=true to the URL.
        // this should be configurable to prevent no staff to enter QA mode
        var match = document.cookie.match("optimizely_qa=([^;]*)");
        if (document.URL.indexOf("optimizely_qa=true") > -1) {
            // entering the QA mode will redirect the page straight away to itself minus the qa query parameter
            // hide the body before the redirect to prevent flickering
            $("head").append("<style>body { visibility:hidden; }</style>");
            // create the QA session cookie
            var now = new Date();
            var timeout = now.getTime() + QASessionTime;
            now.setTime(timeout);
            document.cookie = 'optimizely_qa=' + timeout + ';expires=' + now.toGMTString() + ';path=/';
            // set the default location of the QA widget
            localStorage.setItem("optimizely_qa_left", "20px");
            localStorage.setItem("optimizely_qa_top", "20px");
            // reload page without the query parameter
            window.location.replace(document.URL.replace("optimizely_qa=true", ""));
        } else if (match && match[0].indexOf("optimizely_qa=") > -1) {
            if ($("#qabanner").length < 1) {
                // create the QA widget if it was not created yet (might have more than 1 experiment in QA)
                document.title = '[QA] ' + document.title; // add QA ti page title
                $("html").prepend("<div id='qabanner'><a id='qaend'>x</a><div id='qaheader'>OPTIMIZELY QA SESSION</div><div><ul id='elist'></ul></div><div id='qatimeout'>time left in session</div></div>");
                $("head").append("<style>#qabanner {overflow:hidden;white-space:nowrap;box-shadow:0 0 10px #888;position:absolute;top:20px;left:20px;padding:10px 10px 10px 10px;z-index:1000;background:#104F92;color:white} #qaend {cursor:pointer;color:white;float:right;position:relative;top:-10px;right:-7px} #qaheader {padding-top:10px;padding-bottom:10px} .vswitch {cursor:pointer;color:white} .vswitch.selected {text-decoration:underline}</style>");
                // set position of the widget on screen based on previous placement
                if (localStorage.getItem("optimizely_qa_left") !== null) {
                    $("#qabanner").css({
                        "left": localStorage.getItem("optimizely_qa_left"),
                            "top": localStorage.getItem("optimizely_qa_top")
                    });
                }
                // add the event behind the close session button 
                $("#qaend").bind("click", function () {
                    // delete the cookie and reload the page
                    document.cookie = 'optimizely_qa=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                    location.reload();
                });
            }

            for (var idx = 0; idx < window.QA_EXPERIMENTS.length; idx++) {
                var eid = window.QA_EXPERIMENTS[idx];
                // add list of experiments to the widget
                $("#elist").append("<li class='e" + eid + "' title='" + eid + "'></li>");
            }

            $(document).ready(function () {
                for (var idx = 0; idx < window.QA_EXPERIMENTS.length; idx++) {
                    var eid = window.QA_EXPERIMENTS[idx];
                    // optimizely object is not available when Project JS is running so delay this part of the code
                    // until after dom ready

                    var v = " [";
                    var active = false;
                    var selected = "";

                    if (optimizely.data.experiments[eid].section_ids.length === 0) {
                        // non MVT

                        $(".e" + eid).html(optimizely.data.experiments[eid].name.substring(0, 30));

                        for (i = 0; i < optimizely.data.experiments[eid].variation_ids.length; i++) {
                            // show the active variation
                            selected = optimizely.variationMap[eid] == i ? "selected" : "";
                            v += "<a class='vswitch " + selected + "' title='" + optimizely.data.variations[optimizely.data.experiments[eid].variation_ids[i]].name + "' id='" + optimizely.data.experiments[eid].variation_ids[i] + "'>" + i + "</a>, ";
                        }

                        $(".e" + eid).append("&nbsp;&nbsp;<span>" + v.substring(0, v.length - 2) + "]</span>");

                        $("#elist span").css("float", "right");
                        $(".e" + eid + " .vswitch").bind("click", function () {
                            // switch between variations
                            var parent = $(this).parents().eq(1)[0];
                            optimizely.push(["bucketVisitor", $(parent).attr("title"), $(this).attr('id')]);
                            location.reload();
                        });

                        // strike through experiment if it is not active on this page
                        /*for (i = 0; i < optimizely.activeExperiments.length; i++) {
                            if (optimizely.activeExperiments[i] == eid) {
                                active = true;
                            }
                        }
                        if (!active) {
                            $(".e" + eid).addClass('inactive');
                            $("#elist li.inactive").css("text-decoration", "line-through");
                        }*/
                    } else {

                        $(".e" + eid).html(optimizely.data.experiments[eid].name.substring(0, 30));

                        for (i = optimizely.data.experiments[eid].section_ids.length - 1; i >= 0; i--) {
                            v = " [";
                            selected = "";
                            var section_id = optimizely.data.experiments[eid].section_ids[i];
                            for (j = 0; j < optimizely.data.sections[section_id].variation_ids.length; j++) {
                                // show the active variation
                                selected = document.cookie.indexOf(optimizely.data.sections[section_id].variation_ids[j]) > -1 ? "selected" : "";
                                v += "<a class='vswitch " + selected + "' title='" + optimizely.data.variations[optimizely.data.sections[section_id].variation_ids[j]].name + "' id='" + optimizely.data.sections[section_id].variation_ids[j] + "'>" + j + "</a>, ";
                            }

                            $(".e" + eid).append("&nbsp;&nbsp;<span>" + v.substring(0, v.length - 2) + "]</span>");
                        }

                        $("#elist span").css("float", "right");
                        $(".e" + eid + " .vswitch").bind("click", function () {
                            // switch between variations
                            var parent = $(this).parents().eq(1)[0];

                            $(parent).find(".selected").each(function (index) {
                                optimizely.push(["bucketVisitor", $(parent).attr("title"), $(this).attr('id')]);
                            });

                            optimizely.push(["bucketVisitor", $(parent).attr("title"), $(this).attr('id')]);
                            location.reload();
                        });

                        // strike through experiment if it is not active on this page
                        /*for (i = 0; i < optimizely.activeExperiments.length; i++) {
                            if (optimizely.activeExperiments[i] == eid) {
                                active = true;
                            }
                        }
                        if (!active) {
                            $(".e" + eid).addClass('inactive');
                            $("#elist li.inactive").css("text-decoration", "line-through");
                        }*/

                    }

                    // strike through experiment if it is not active on this page
                    for (i = 0; i < optimizely.activeExperiments.length; i++) {
                        if (optimizely.activeExperiments[i] == eid) {
                            active = true;
                        }
                    }
                    if (!active) {
                        $(".e" + eid).addClass('inactive');
                        $("#elist li.inactive").css("text-decoration", "line-through");
                    }
                }
            });

            // count down till session expire
            setInterval(function () {
                var timeout = getCookie("optimizely_qa");
                var seconds_left = (timeout - new Date().getTime()) / 1000;
                if (seconds_left < 0) {
                    // session expires
                    location.reload();
                } else {
                    seconds_left = seconds_left % 86400;
                    seconds_left = seconds_left % 3600;
                    $("#qatimeout").html("time left in session " + parseInt(seconds_left / 60) + "m" + parseInt(seconds_left % 60) + "s");
                }
            }, 1000);

            // handle moving the widget around the screen (this does not work properly)
            var x_pos = $("#qabanner").css("left").substring($("#qabanner").css("left"), $("#qabanner").css("left").length - 2);
            var y_pos = $("#qabanner").css("top").substring($("#qabanner").css("top"), $("#qabanner").css("top").length - 2);
            var x_elem = 0,
                y_elem = 0;
            var moving = false;

            $('#qabanner').mousedown(function () { // move div
                x_elem = x_pos - $("#qabanner").css("left").substring($("#qabanner").css("left"), $("#qabanner").css("left").length - 2);
                y_elem = y_pos - $("#qabanner").css("top").substring($("#qabanner").css("top"), $("#qabanner").css("top").length - 2);
                moving = true;
            });

            $(document).mousemove(function (e) {
                if (moving === true) {
                    $("#qabanner").css("left", (e.pageX - x_elem) + "px");
                    $("#qabanner").css("top", (e.pageY - y_elem) + "px");
                    e.preventDefault();
                }
            });

            $(document).mouseup(function (e) {
                moving = false;
                x_pos = $("#qabanner").css("left").substring($("#qabanner").css("left"), $("#qabanner").css("left").length - 2);
                y_pos = $("#qabanner").css("top").substring($("#qabanner").css("top"), $("#qabanner").css("top").length - 2);
                localStorage.setItem("optimizely_qa_left", $("#qabanner").css("left"));
                localStorage.setItem("optimizely_qa_top", $("#qabanner").css("top"));
            });
        } else {
            // No QA mode! 
            // Disable all the experiments from the array
            for (i = 0; i < window.QA_EXPERIMENTS.length; i++) {
                //console.log("Disable QA experiment " +window.QA_EXPERIMENTS[i]);
                DATA.experiments[window.QA_EXPERIMENTS[i]].enabled = false;
            }
        }

        function getCookie(cname) {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1);
                if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
            }
            return "";
        }

    })(DATA);
}
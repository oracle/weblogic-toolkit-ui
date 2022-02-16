/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'ojs/ojcorerouter'],
  function(ko, CoreRouter) {
    function ScreenUtils() {
      const thisUtil = this;
      const imageDesignViewSelectedSubview = ko.observable();
      let pendingImageDesignViewSubviewSelection;
      let mainNavigationRouter;

      this.sliderPositions = {};

      // load these once, when ScreenUtils is initialized, not on each invocation
      window.api.ipc.invoke('get-divider-locations').then(locations => {
        this.sliderPositions = Object.assign({}, locations);
      });

      // create a slider pane for three elements
      this.sliderPane = (slider, onePane, twoPane, name, vertical) => {
        const parentElement = slider.parentElement;

        let lastDown = {
          e: null,
          offset: vertical ? slider.offsetTop : slider.offsetLeft,
          oneSize: vertical ? onePane.offsetHeight : onePane.offsetWidth,
          twoSize: vertical ? twoPane.offsetHeight : twoPane.offsetWidth,
          parentSize: vertical ? parentElement.offsetHeight : parentElement.offsetWidth
        };

        const percent = this.sliderPositions[name];
        if (percent) {
          if (vertical) {
            const oneHeight = Math.round(percent * parentElement.offsetHeight);
            onePane.style.height = oneHeight + 'px';
            twoPane.style.height = (parentElement.offsetHeight - oneHeight) + 'px';
          } else {
            const oneWidth = Math.round(percent * parentElement.offsetWidth);
            onePane.style.width = oneWidth + 'px';
            twoPane.style.width = (parentElement.offsetWidth - oneWidth) + 'px';
          }
        }

        slider.onmousedown = (e => {
          lastDown = {
            e,
            offset: vertical ? slider.offsetTop : slider.offsetLeft,
            oneSize: vertical ? onePane.offsetHeight : onePane.offsetWidth,
            twoSize: vertical ? twoPane.offsetHeight : twoPane.offsetWidth,
            parentSize: vertical ? parentElement.offsetHeight : parentElement.offsetWidth
          };

          document.onmousemove = onMouseMove;
          document.onmouseup = onMouseUp;
        });

        function onMouseMove(e) {
          if (vertical) {
            let delta = e.clientY - lastDown.e.clientY;
            delta = Math.min(Math.max(delta, -lastDown.oneSize), lastDown.twoSize);

            onePane.style.height = (lastDown.oneSize + delta) + 'px';
            twoPane.style.height = (lastDown.twoSize - delta) + 'px';

          } else {  // horizontal
            let delta = e.clientX - lastDown.e.clientX;
            delta = Math.min(Math.max(delta, -lastDown.oneSize), lastDown.twoSize);

            onePane.style.width = (lastDown.oneSize + delta) + 'px';
            twoPane.style.width = (lastDown.twoSize - delta) + 'px';
          }
        }

        function onMouseUp() {
          document.onmousemove = document.onmouseup = null;

          const oneSize = vertical ? onePane.offsetHeight : onePane.offsetWidth;
          const mouseUpPercent = oneSize / lastDown.parentSize;
          thisUtil.sliderPositions[name] = mouseUpPercent;
          window.api.ipc.send('set-divider-location', name, mouseUpPercent);
        }

        new ResizeObserver(() => {
          // if the parent container was resized in the specified direction,
          // clear any assigned heights or widths

          if(lastDown) {
            if (vertical) {
              if(lastDown.parentSize !== parentElement.offsetHeight) {
                onePane.style.height = null;
                twoPane.style.height = null;
              }
            } else {
              if(lastDown.parentSize !== parentElement.offsetWidth) {
                onePane.style.width = null;
                twoPane.style.width = null;
              }
            }
          }
        }).observe(parentElement);
      };

      this.createMainNavigationRouter = (routeData, routeOptions) => {
        mainNavigationRouter = new CoreRouter(routeData, routeOptions);
      };

      this.getMainNavigationRouter = () => {
        return mainNavigationRouter;
      };

      this.gotoMainPage = (path) => {
        mainNavigationRouter.go({ path: path });
      };

      this.setImageDesignViewSelectedSubview = (view, honorPendingTabChange = false) => {
        if (honorPendingTabChange && pendingImageDesignViewSubviewSelection) {
          imageDesignViewSelectedSubview(pendingImageDesignViewSubviewSelection);
          pendingImageDesignViewSubviewSelection = undefined;
        } else {
          imageDesignViewSelectedSubview(view);
        }
      };

      this.getImageDesignViewSelectedSubviewObservable = () => {
        return imageDesignViewSelectedSubview;
      };

      this.setPendingImageDesignViewSubviewSelection = (view) => {
        pendingImageDesignViewSubviewSelection = view;
      };

      this.gotoImageDesignPrimaryImageScreen = () => {
        this.setPendingImageDesignViewSubviewSelection('primaryImage');
        this.gotoMainPage('image-page');
      };

      this.gotoImageDesignAuxiliaryImageScreen = () => {
        this.setPendingImageDesignViewSubviewSelection('auxiliaryImage');
        this.gotoMainPage('image-page');
      };
    }

    return new ScreenUtils();
  }
);

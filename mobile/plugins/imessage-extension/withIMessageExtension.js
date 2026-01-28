const { withXcodeProject } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const EXTENSION_NAME = "WagerPalsMessages";
const EXTENSION_BUNDLE_ID_SUFFIX = ".messages";
const SWIFT_FILES = [
  "MessagesViewController.swift",
  "ComposeWagerView.swift",
  "WagerMessageComposer.swift",
];

function withIMessageExtension(config) {
  return withIMessageXcodeProject(config);
}

const withIMessageXcodeProject = (config) => {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const platformRoot = config.modRequest.platformProjectRoot;
    const appBundleId = config.ios?.bundleIdentifier || "com.wagerpals.app";
    const extensionBundleId = `${appBundleId}${EXTENSION_BUNDLE_ID_SUFFIX}`;
    const devTeam = "3C4383262W";

    const existingTarget = xcodeProject.pbxTargetByName(EXTENSION_NAME);
    if (existingTarget) {
      console.log(`[iMessage] Target ${EXTENSION_NAME} already exists, skipping.`);
      return config;
    }

    // 1. Copy files to disk
    const extensionDir = path.join(platformRoot, EXTENSION_NAME);
    fs.mkdirSync(extensionDir, { recursive: true });

    const swiftSourceDir = path.join(__dirname, "swift");
    for (const file of SWIFT_FILES) {
      fs.copyFileSync(
        path.join(swiftSourceDir, file),
        path.join(extensionDir, file)
      );
    }

    fs.writeFileSync(
      path.join(extensionDir, "Info.plist"),
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>CFBundleDevelopmentRegion</key>
\t<string>$(DEVELOPMENT_LANGUAGE)</string>
\t<key>CFBundleDisplayName</key>
\t<string>WagerPals</string>
\t<key>CFBundleExecutable</key>
\t<string>$(EXECUTABLE_NAME)</string>
\t<key>CFBundleIdentifier</key>
\t<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
\t<key>CFBundleInfoDictionaryVersion</key>
\t<string>6.0</string>
\t<key>CFBundleName</key>
\t<string>$(PRODUCT_NAME)</string>
\t<key>CFBundlePackageType</key>
\t<string>XPC!</string>
\t<key>CFBundleShortVersionString</key>
\t<string>$(MARKETING_VERSION)</string>
\t<key>CFBundleVersion</key>
\t<string>$(CURRENT_PROJECT_VERSION)</string>
\t<key>NSExtension</key>
\t<dict>
\t\t<key>NSExtensionPointIdentifier</key>
\t\t<string>com.apple.message-payload-provider</string>
\t\t<key>NSExtensionPrincipalClass</key>
\t\t<string>$(PRODUCT_MODULE_NAME).MessagesViewController</string>
\t</dict>
</dict>
</plist>`
    );

    fs.writeFileSync(
      path.join(extensionDir, `${EXTENSION_NAME}.entitlements`),
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
</dict>
</plist>`
    );

    const assetsDir = path.join(extensionDir, "Assets.xcassets", "AppIcon.appiconset");
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(
      path.join(extensionDir, "Assets.xcassets", "Contents.json"),
      JSON.stringify({ info: { version: 1, author: "xcode" } }, null, 2)
    );
    fs.writeFileSync(
      path.join(assetsDir, "Contents.json"),
      JSON.stringify({
        images: [
          { idiom: "iphone", size: "60x45", scale: "2x" },
          { idiom: "iphone", size: "60x45", scale: "3x" },
          { idiom: "ipad", size: "67x50", scale: "2x" },
          { idiom: "ios-marketing", size: "1024x768", scale: "1x" },
        ],
        info: { version: 1, author: "xcode" },
      }, null, 2)
    );

    // 2. Add extension target
    const target = xcodeProject.addTarget(
      EXTENSION_NAME,
      "app_extension",
      EXTENSION_NAME,
      `${EXTENSION_NAME}/Info.plist`
    );

    if (!target || !target.uuid) {
      console.error("[iMessage] Failed to add target");
      return config;
    }

    // 3. Add a PBX group and files using addPbxGroup which handles everything
    const sourceFiles = SWIFT_FILES.map((f) => ({
      path: f,
      basename: f,
    }));
    const resourceFiles = [
      { path: "Assets.xcassets", basename: "Assets.xcassets" },
    ];

    // Use addPbxGroup to create the group with children
    const { uuid: groupUuid } = xcodeProject.addPbxGroup(
      [...SWIFT_FILES, "Assets.xcassets", "Info.plist", `${EXTENSION_NAME}.entitlements`],
      EXTENSION_NAME,
      EXTENSION_NAME
    );

    // Add group to main project group
    const mainGroupId = xcodeProject.getFirstProject().firstProject.mainGroup;
    const mainGroup = xcodeProject.getPBXGroupByKey(mainGroupId);
    if (mainGroup) {
      mainGroup.children.push({
        value: groupUuid,
        comment: EXTENSION_NAME,
      });
    }

    // 4. Add source files to the extension's Sources build phase
    for (const file of SWIFT_FILES) {
      xcodeProject.addSourceFile(
        `${EXTENSION_NAME}/${file}`,
        { target: target.uuid },
        groupUuid
      );
    }

    // 5. Add Assets.xcassets to the extension's Resources build phase
    // Find the resources build phase for the extension target
    const nativeTargets = xcodeProject.pbxNativeTargetSection();
    let resourcesBuildPhaseId = null;
    for (const key in nativeTargets) {
      const nt = nativeTargets[key];
      if (nt && nt.name === EXTENSION_NAME && nt.buildPhases) {
        for (const phase of nt.buildPhases) {
          if (phase.comment && phase.comment.includes("Resources")) {
            resourcesBuildPhaseId = phase.value;
            break;
          }
        }
      }
    }

    if (resourcesBuildPhaseId) {
      const assetFileRefUuid = xcodeProject.generateUuid();
      const assetBuildFileUuid = xcodeProject.generateUuid();

      // Add file reference for Assets.xcassets
      const fileRefSection = xcodeProject.hash.project.objects["PBXFileReference"];
      fileRefSection[assetFileRefUuid] = {
        isa: "PBXFileReference",
        lastKnownFileType: "folder.assetcatalog",
        path: "Assets.xcassets",
        sourceTree: '"<group>"',
      };
      fileRefSection[`${assetFileRefUuid}_comment`] = "Assets.xcassets";

      // Add build file
      const buildFileSection = xcodeProject.hash.project.objects["PBXBuildFile"];
      buildFileSection[assetBuildFileUuid] = {
        isa: "PBXBuildFile",
        fileRef: assetFileRefUuid,
        fileRef_comment: "Assets.xcassets",
      };
      buildFileSection[`${assetBuildFileUuid}_comment`] = "Assets.xcassets in Resources";

      // Add to the resources build phase
      const resourcesPhase = xcodeProject.hash.project.objects["PBXResourcesBuildPhase"][resourcesBuildPhaseId];
      if (resourcesPhase) {
        resourcesPhase.files = resourcesPhase.files || [];
        resourcesPhase.files.push({
          value: assetBuildFileUuid,
          comment: "Assets.xcassets in Resources",
        });
      }
    }

    // 6. Set build settings for extension target
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    const targetConfigs = xcodeProject.pbxXCConfigurationList()[
      target.pbxNativeTarget.buildConfigurationList
    ];

    if (targetConfigs && targetConfigs.buildConfigurations) {
      for (const configRef of targetConfigs.buildConfigurations) {
        const configObj = configurations[configRef.value];
        if (configObj) {
          configObj.buildSettings = configObj.buildSettings || {};
          Object.assign(configObj.buildSettings, {
            CODE_SIGN_ENTITLEMENTS: `"${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements"`,
            CODE_SIGN_STYLE: "Automatic",
            CURRENT_PROJECT_VERSION: "1",
            DEVELOPMENT_TEAM: `"${devTeam}"`,
            INFOPLIST_FILE: `"${EXTENSION_NAME}/Info.plist"`,
            IPHONEOS_DEPLOYMENT_TARGET: "15.1",
            LD_RUNPATH_SEARCH_PATHS: `"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"`,
            MARKETING_VERSION: "1.0",
            PRODUCT_BUNDLE_IDENTIFIER: `"${extensionBundleId}"`,
            PRODUCT_NAME: `"$(TARGET_NAME)"`,
            SKIP_INSTALL: "YES",
            SWIFT_VERSION: "5.0",
            TARGETED_DEVICE_FAMILY: `"1,2"`,
          });
        }
      }
    }

    // 7. Set ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES on main app target
    const appTarget = xcodeProject.getFirstTarget();
    if (appTarget && appTarget.firstTarget) {
      const appConfigList = xcodeProject.pbxXCConfigurationList()[
        appTarget.firstTarget.buildConfigurationList
      ];
      if (appConfigList && appConfigList.buildConfigurations) {
        for (const configRef of appConfigList.buildConfigurations) {
          const configObj = configurations[configRef.value];
          if (configObj && configObj.buildSettings) {
            configObj.buildSettings.ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES = "YES";
          }
        }
      }
    }

    // 8. Add .appex product to Products group so CocoaPods can find its parent
    const productFileRef = target.pbxNativeTarget.productReference;
    if (productFileRef) {
      const productsGroupId = xcodeProject.findPBXGroupKey({ name: "Products" });
      if (productsGroupId) {
        const productsGroup = xcodeProject.getPBXGroupByKey(productsGroupId);
        if (productsGroup && productsGroup.children) {
          productsGroup.children.push({
            value: productFileRef,
            comment: `${EXTENSION_NAME}.appex`,
          });
        }
      }
    }

    // 9. Add target dependency and embed extension
    xcodeProject.addTargetDependency(appTarget.firstTarget.uuid, [target.uuid]);

    // Embed the extension manually to avoid orphan file references
    const embedPhaseUuid = xcodeProject.generateUuid();
    const embedBuildFileUuid = xcodeProject.generateUuid();

    // Create a build file referencing the product
    const buildFileSection = xcodeProject.hash.project.objects["PBXBuildFile"];
    buildFileSection[embedBuildFileUuid] = {
      isa: "PBXBuildFile",
      fileRef: productFileRef,
      fileRef_comment: `${EXTENSION_NAME}.appex`,
      settings: { ATTRIBUTES: ["RemoveHeadersOnCopy"] },
    };
    buildFileSection[`${embedBuildFileUuid}_comment`] = `${EXTENSION_NAME}.appex in Embed Foundation Extensions`;

    // Create the copy files build phase
    const copyFilesSection = xcodeProject.hash.project.objects["PBXCopyFilesBuildPhase"] || {};
    xcodeProject.hash.project.objects["PBXCopyFilesBuildPhase"] = copyFilesSection;
    copyFilesSection[embedPhaseUuid] = {
      isa: "PBXCopyFilesBuildPhase",
      buildActionMask: 2147483647,
      dstPath: '""',
      dstSubfolderSpec: 13,
      files: [{ value: embedBuildFileUuid, comment: `${EXTENSION_NAME}.appex in Embed Foundation Extensions` }],
      name: '"Embed Foundation Extensions"',
      runOnlyForDeploymentPostprocessing: 0,
    };
    copyFilesSection[`${embedPhaseUuid}_comment`] = "Embed Foundation Extensions";

    // Add this phase to the main app target
    const appNativeTargets = xcodeProject.pbxNativeTargetSection();
    for (const key in appNativeTargets) {
      const nt = appNativeTargets[key];
      if (nt && nt.name === appTarget.firstTarget.name && nt.buildPhases) {
        nt.buildPhases.push({ value: embedPhaseUuid, comment: "Embed Foundation Extensions" });
        break;
      }
    }

    // 9. Add project attributes
    const projectSection = xcodeProject.pbxProjectSection();
    for (const key in projectSection) {
      const proj = projectSection[key];
      if (proj && proj.attributes && proj.attributes.TargetAttributes) {
        proj.attributes.TargetAttributes[target.uuid] = {
          DevelopmentTeam: devTeam,
          ProvisioningStyle: "Automatic",
        };
      }
    }

    console.log(`[iMessage] Successfully added ${EXTENSION_NAME} extension target`);
    return config;
  });
};

module.exports = withIMessageExtension;

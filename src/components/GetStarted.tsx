import React from 'react';
import { Flex, Heading, Box, Tabs, Tab, Txt, Select } from 'rendition';
import { DownloadImage } from './DownloadImage';
import { Indicator } from './Indicator';
import { ExternalLink } from './ExternalLink';
import BalenaSdk from 'balena-sdk';
import insertCard from '../img/insert-sd.gif';
import flashCard from '../img/etcher.gif';
import tasksImg from '../img/tasks.png';
import { DownloadEtcher } from './DownloadEtcher';
import { LazyImage } from './LazyImage';

const handleError = (err: Error) => {
	// TODO: Show notification instead.
	console.error(err);
};

const getAppArch = (
	app: BalenaSdk.Application,
	deviceTypes: BalenaSdk.DeviceType[],
) => {
	return deviceTypes.find((deviceType) => deviceType.slug === app.device_type)
		?.arch;
};

const getCompatibleDeviceTypes = (
	app: BalenaSdk.Application,
	deviceTypes: BalenaSdk.DeviceType[],
	sdk: BalenaSdk.BalenaSDK,
) => {
	const targetArch = getAppArch(app, deviceTypes);

	if (!targetArch) {
		throw new Error('Failed to find the device type');
	}

	return deviceTypes.filter((deviceType) =>
		sdk.models.os.isArchitectureCompatibleWith(deviceType.arch, targetArch),
	);
};

interface StepProps {
	index: number;
	children: React.ReactNode;
}

const Step = ({ index, children }: StepProps) => (
	<Flex mt={4}>
		<Indicator index={index} />
		<Flex
			ml={2}
			flexDirection="column"
			alignItems="flex-start"
			justifyContent="left"
		>
			{children}
		</Flex>
	</Flex>
);

const GetStarted = ({
	applications,
	sdk,
}: {
	sdk: BalenaSdk.BalenaSDK;
	applications: BalenaSdk.Application[] | undefined;
}) => {
	const [selectedAppArch, setSelectedAppArch] = React.useState('aarch64');

	const [selectedApp, setSelectedApp] = React.useState<
		BalenaSdk.Application | undefined
	>();
	const [selectedDeviceType, setSelectedDeviceType] = React.useState<
		BalenaSdk.DeviceType | undefined
	>();
	const [compatibleDeviceTypes, setCompatibleDeviceTypes] = React.useState<
		BalenaSdk.DeviceType[] | undefined
	>();
	const [deviceTypes, setDeviceTypes] = React.useState<
		BalenaSdk.DeviceType[] | undefined
	>();

	React.useEffect(() => {
		sdk.models.config
			.getDeviceTypes()
			.then((res) =>
				res
					.filter((deviceType) => deviceType.state !== 'DISCONTINUED')
					.sort((a, b) => a.name.localeCompare(b.name)),
			)
			.then(setDeviceTypes)
			.catch(handleError);
	}, [sdk.models.config]);

	React.useEffect(() => {
		if (!deviceTypes || !applications || !selectedAppArch) {
			return;
		}

		const compatibleApp = applications.find((app) =>
			sdk.models.os.isArchitectureCompatibleWith(
				getAppArch(app, deviceTypes) ?? '',
				selectedAppArch,
			),
		);

		if (!compatibleApp) {
			handleError(
				new Error('Could not find an application with a suitable architecture'),
			);
			return;
		}

		setSelectedApp(compatibleApp);
		setCompatibleDeviceTypes(
			getCompatibleDeviceTypes(compatibleApp, deviceTypes, sdk),
		);
	}, [deviceTypes, applications, selectedAppArch, sdk.models.os, sdk]);

	React.useEffect(() => {
		if (
			selectedDeviceType &&
			compatibleDeviceTypes?.some(
				(deviceType) => deviceType.slug === selectedDeviceType.slug,
			)
		) {
			return;
		}

		setSelectedDeviceType(compatibleDeviceTypes?.[0]);
	}, [compatibleDeviceTypes, selectedDeviceType, selectedApp]);

	const deviceTypeSelector = compatibleDeviceTypes ? (
		<Select<BalenaSdk.DeviceType>
			mt={3}
			mb={3}
			mr={3}
			maxWidth={300}
			options={compatibleDeviceTypes}
			valueKey="slug"
			labelKey="name"
			value={selectedDeviceType || {}}
			onChange={({ option }) => {
				setSelectedDeviceType(option);
			}}
		/>
	) : null;

	return (
		<Box id="get-started" bg="primary.light">
			<Flex mt={2} mx="auto" maxWidth="1280px" flexDirection={'column'} p={3}>
				<Heading.h2 pt={4} bold>
					Get Started
				</Heading.h2>

				<Box mt={3} maxWidth="100%" width="600px">
					<Tabs
						onActive={(activeIndex) =>
							setSelectedAppArch(activeIndex === 0 ? 'aarch64' : 'amd64')
						}
					>
						<Tab
							title={
								<Txt fontSize={2} bold>
									Boards
								</Txt>
							}
						>
							{deviceTypeSelector}

							<Txt.p fontSize={2}>
								Getting started on a{' '}
								<Txt.span bold>{selectedDeviceType?.name}</Txt.span> is simple!
								Follow these steps to download our ready-made operating system,
								flash it to an SD Card, and begin crunching data to help
								scientists!
							</Txt.p>
							{selectedDeviceType?.name?.includes('raspberry') && (
								<Txt.p fontSize={2}>
									<Txt.span bold>
										Please Note: This project requires a{' '}
										{selectedDeviceType?.name} with 2GB or 4GB of memory
									</Txt.span>
									. These simulations are large and the 1GB version of the
									{selectedDeviceType?.name} doesn’t have enough memory to run
									the work units Rosetta@Home provides.
								</Txt.p>
							)}
						</Tab>
						<Tab
							title={
								<Txt fontSize={2} bold>
									Laptops or Desktop Computers
								</Txt>
							}
						>
							{deviceTypeSelector}

							<Txt.p fontSize={2}>
								Getting started on an unused laptop or desktop PC is easy!
								Follow these steps to download our ready-made operating system,
								flash it to a USB stick, and begin crunching data to help
								scientists!
							</Txt.p>

							<Txt.p mt={3} fontSize={2}>
								<Txt.span bold>WARNING:</Txt.span> This project is intended to
								be used on a spare, unused computer. It will overwrite your
								existing hard drive contents, causing loss of ALL data on the
								computer. Only run this on a device that you don’t plan on
								using.
							</Txt.p>
						</Tab>
					</Tabs>

					<Heading.h3 bold my={3}>
						Let's begin
					</Heading.h3>
					<Step index={1}>
						<Txt fontSize={2} bold>
							Download and Install{' '}
							<ExternalLink
								href="https://balena.io/etcher"
								label="balenaEtcher"
							/>
						</Txt>
						<DownloadEtcher />
					</Step>
					<Step index={2}>
						<Txt fontSize={2} bold>
							Download the ready-made Operating System below.
						</Txt>
						<DownloadImage
							sdk={sdk}
							selectedApp={selectedApp}
							selectedDeviceType={selectedDeviceType}
						/>
					</Step>
					<Step index={3}>
						<Txt fontSize={2} bold>
							Launch balenaEtcher
						</Txt>
						<Txt fontSize={2} my={3}>
							choose the file you just downloaded, select your SD card and click
							"Flash".
						</Txt>
						<Flex
							alignItems="center"
							justifyContent="center"
							maxHeight="300px"
							maxWidth="500px"
							pt={2}
						>
							<LazyImage src={flashCard} alt="Flash card with Etcher" />
						</Flex>
					</Step>
					<Step index={4}>
						<Txt fontSize={2}>
							Once complete,{' '}
							<Txt.span bold>
								place the SD Card in your {selectedDeviceType?.name}, and power
								it on
							</Txt.span>
							.
						</Txt>
						<Flex
							alignItems="center"
							justifyContent="center"
							maxHeight="300px"
							maxWidth="500px"
							pt={2}
						>
							<LazyImage src={insertCard} alt="Insert card in device" />
						</Flex>
					</Step>
					<Step index={5}>
						<Txt fontSize={2}>
							<Txt.span>
								Your {selectedDeviceType?.name} will automatically join the
								Fleet, and begin crunching data!
							</Txt.span>
						</Txt>
					</Step>
					<Step index={6}>
						<Txt fontSize={2}>
							<Txt.span>
								To view your {selectedDeviceType?.name}'s current activity,
								visit your {selectedDeviceType?.name}’s new hostname,
								foldforcovid.local, in a web browser like this:{' '}
							</Txt.span>
							<ExternalLink
								href="http://foldforcovid.local"
								label="foldforcovid.local"
							/>
							.
						</Txt>
						<Flex
							alignItems="center"
							justifyContent="center"
							maxHeight="300px"
							maxWidth="500px"
							pt={2}
						>
							<LazyImage src={tasksImg} alt="Rosetta tasks on your device" />
						</Flex>
					</Step>
				</Box>
			</Flex>
		</Box>
	);
};

export default GetStarted;
